import Message from '../models/Message.js';
import GmailCredential from '../models/GmailCredential.js';
import { decryptRefreshToken } from '../utils/gmailTokenCrypto.js';

const normalizeEmail = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const getAllowedAdminEmails = () =>
  (process.env.ALLOWED_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isAllowedAdmin = (email) =>
  getAllowedAdminEmails().includes(normalizeEmail(email));

const jsonOrEmpty = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const sendMessageReply = async (req, res, next) => {
  try {
    const adminEmail = normalizeEmail(req.user?.email);

    if (!adminEmail || !isAllowedAdmin(adminEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized admin account.',
      });
    }

    const reply =
      typeof req.body.reply === 'string' ? req.body.reply.trim() : '';

    if (!reply || reply.length > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Reply must contain between 1 and 10,000 characters.',
      });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      });
    }

    const recipientEmail = normalizeEmail(message.email);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(recipientEmail) || /[\r\n]/.test(message.email || '')) {
      return res.status(400).json({
        success: false,
        message: 'Visitor email address is invalid.',
      });
    }

    // Important: select the logged-in admin's credential, never a global one.
    const credential = await GmailCredential.findOne({
      provider: 'gmail',
      email: adminEmail,
    });

    if (!credential) {
      return res.status(409).json({
        success: false,
        message:
          'Gmail permission is not saved for this account. Sign in again and grant Gmail send permission.',
      });
    }

    const refreshToken = decryptRefreshToken(credential);
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth credentials are not configured.',
      });
    }

    // Exchange the stored refresh token for a short-lived access token.
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await jsonOrEmpty(tokenResponse);

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Gmail token refresh failed:', {
        status: tokenResponse.status,
        error: tokenData.error,
        description: tokenData.error_description,
        adminEmail,
      });

      const status = tokenData.error === 'invalid_grant' ||
        tokenData.error === 'unauthorized_client' ? 401 : 502;

      return res.status(status).json({
        success: false,
        message:
          'Google rejected this account’s saved Gmail authorization. Sign in again and grant Gmail send permission.',
        code: tokenData.error || 'gmail_token_refresh_failed',
      });
    }

    const safeSubject = (message.subject || 'General Inquiry')
      .replace(/[\r\n]+/g, ' ')
      .trim();
    const subject = /^re:/i.test(safeSubject)
      ? safeSubject
      : `Re: ${safeSubject}`;

    const quotedOriginal = (message.message || '')
      .split(/\r?\n/)
      .map((line) => `> ${line}`)
      .join('\n');

    const originalDate = message.createdAt
      ? new Date(message.createdAt).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata',
        })
      : 'Not available';

    const body = [
      reply,
      '',
      '---------------- Original message ----------------',
      `From: ${message.name || 'Visitor'} <${recipientEmail}>`,
      `Date: ${originalDate}`,
      `Subject: ${safeSubject}`,
      '',
      quotedOriginal,
    ].join('\n');

    const headers = [
      `From: ${credential.email}`,
      `To: ${recipientEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
    ];

    const raw = Buffer
      .from(`${headers.join('\r\n')}\r\n\r\n${body}`, 'utf8')
      .toString('base64url');

    const gmailResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      }
    );

    const sent = await jsonOrEmpty(gmailResponse);

    if (!gmailResponse.ok) {
      console.error('Gmail API send failed:', {
        status: gmailResponse.status,
        error: sent.error?.message || sent.error,
        adminEmail,
      });

      return res.status(gmailResponse.status === 401 ? 401 : 502).json({
        success: false,
        message: sent.error?.message || 'Gmail could not send this reply.',
      });
    }

    message.replies = message.replies || [];
    message.replies.push({
      body: reply,
      from: credential.email,
      to: recipientEmail,
      sentAt: new Date(),
      gmailMessageId: sent.id || null,
    });

    await message.save();

    return res.status(200).json({
      success: true,
      message: 'Reply sent successfully and saved to the conversation.',
      data: message,
    });
  } catch (error) {
    console.error('Gmail reply failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
    });
    next(error);
  }
};
