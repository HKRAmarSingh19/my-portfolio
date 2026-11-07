
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import GmailCredential from '../models/GmailCredential.js';

import {
  createGoogleOAuthClient,
  GMAIL_SCOPE,
  google,
} from '../config/googleOAuth.js';

import {
  encryptRefreshToken,
  decryptRefreshToken,
} from '../utils/gmailTokenCrypto.js';

// --------------------------------------------------
// URL HELPERS
// --------------------------------------------------

const getClientUrl = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');

const getAdminMessagesUrl = () =>
  `${getClientUrl()}/admin/messages`;

const redirectWithError = (res, reason) => {
  return res.redirect(
    `${getAdminMessagesUrl()}?gmail=error&reason=${encodeURIComponent(reason)}`
  );
};

// --------------------------------------------------
// 1. START GMAIL OAUTH
// GET /api/messages/gmail/connect
// Protected route
// --------------------------------------------------

export const startGmailOAuth = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const oauth2Client = createGoogleOAuthClient();

    // Signed state protects the OAuth callback against CSRF.
    const state = jwt.sign(
      { purpose: 'gmail-oauth' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [GMAIL_SCOPE],
      state,
    });

    // Frontend receives the URL and redirects the browser to Google.
    return res.status(200).json({
      success: true,
      url,
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// 2. GMAIL OAUTH CALLBACK
// GET /api/messages/gmail/callback
// Public route
// --------------------------------------------------

export const handleGmailOAuthCallback = async (req, res) => {
  try {
    if (req.query.error) {
      return redirectWithError(res, 'google_authorization_denied');
    }

    const { code, state } = req.query;

    if (!code || !state) {
      return redirectWithError(res, 'missing_code_or_state');
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing.');
      return redirectWithError(res, 'server_configuration_error');
    }

    // Verify signed OAuth state.
    let decoded;

    try {
      decoded = jwt.verify(state, process.env.JWT_SECRET);
    } catch {
      return redirectWithError(res, 'invalid_or_expired_state');
    }

    if (decoded.purpose !== 'gmail-oauth') {
      return redirectWithError(res, 'invalid_state');
    }

    const connectedEmail = process.env.GMAIL_USER_EMAIL
      ?.trim()
      .toLowerCase();

    if (!connectedEmail) {
      console.error('GMAIL_USER_EMAIL is not configured.');
      return redirectWithError(res, 'missing_gmail_user_email');
    }

    const oauth2Client = createGoogleOAuthClient();

    // Exchange authorization code for tokens.
    const { tokens } = await oauth2Client.getToken(code);

    // Preserve an existing refresh token if Google does not
    // return a new one.
    const existing = await GmailCredential.findOne({
      provider: 'gmail',
    });

    const refreshToken =
      tokens.refresh_token ||
      (existing ? decryptRefreshToken(existing) : null);

    if (!refreshToken) {
      return redirectWithError(res, 'no_refresh_token');
    }

    // Encrypt refresh token before saving it.
    const encrypted = encryptRefreshToken(refreshToken);

    await GmailCredential.findOneAndUpdate(
      { provider: 'gmail' },
      {
        provider: 'gmail',
        email: connectedEmail,
        ...encrypted,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(`Gmail connected successfully: ${connectedEmail}`);

    return res.redirect(
      `${getAdminMessagesUrl()}?gmail=connected`
    );
  } catch (error) {
    console.error('Gmail OAuth callback failed:', error.message);

    return redirectWithError(res, 'oauth_callback_failed');
  }
};

// --------------------------------------------------
// 3. GET GMAIL CONNECTION STATUS
// GET /api/messages/gmail/status
// Protected route
// --------------------------------------------------

export const getGmailStatus = async (req, res, next) => {
  try {
    const credential = await GmailCredential.findOne({
      provider: 'gmail',
    }).select('email updatedAt');

    return res.status(200).json({
      success: true,
      connected: Boolean(credential),
      email: credential?.email || null,
      connectedAt: credential?.updatedAt || null,
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------
// 4. SEND REPLY TO VISITOR
// POST /api/messages/:id/reply
// Protected route
// --------------------------------------------------

export const sendMessageReply = async (req, res, next) => {
  try {
    const reply =
      typeof req.body.reply === 'string'
        ? req.body.reply.trim()
        : '';

    // Validate reply.
    if (!reply || reply.length > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Reply must contain between 1 and 10,000 characters.',
      });
    }

    // Find original visitor message.
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      });
    }

    // Check Gmail connection.
    const credential = await GmailCredential.findOne({
      provider: 'gmail',
    });

    if (!credential) {
      return res.status(409).json({
        success: false,
        message: 'Gmail is not connected. Connect Gmail first.',
      });
    }

    // Get decrypted refresh token.
    const refreshToken = decryptRefreshToken(credential);

    if (!refreshToken) {
      return res.status(409).json({
        success: false,
        message: 'Gmail refresh token is missing. Reconnect Gmail.',
      });
    }

    // Configure Google OAuth client.
    const oauth2Client = createGoogleOAuthClient();

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client,
    });

    // Prepare email subject.
    const safeSubject = (message.subject || 'General Inquiry')
      .replace(/[\r\n]+/g, ' ')
      .trim();

    const subject = /^re:/i.test(safeSubject)
      ? safeSubject
      : `Re: ${safeSubject}`;

    // Quote original visitor message.
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
      `From: ${message.name} <${message.email}>`,
      `Date: ${originalDate}`,
      `Subject: ${safeSubject}`,
      '',
      quotedOriginal,
    ].join('\n');

    // Build email headers.
    const headers = [
      `To: ${message.email}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
    ];

    if (credential.email) {
      headers.unshift(`From: ${credential.email}`);
    }

    const rawMessage =
      `${headers.join('\r\n')}\r\n\r\n${body}`;

    // Gmail API requires base64url encoded MIME message.
    const raw = Buffer
      .from(rawMessage, 'utf8')
      .toString('base64url');

    // Send email through connected Gmail account.
    const sent = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });

    // Save reply in MongoDB conversation history.
    message.replies.push({
      body: reply,
      from: credential.email,
      to: message.email,
      sentAt: new Date(),
      gmailMessageId: sent.data.id || null,
    });

    await message.save();

    return res.status(200).json({
      success: true,
      message: 'Reply sent successfully and saved to the conversation.',
      data: message,
    });
  } catch (error) {
    console.error('Gmail reply failed:', error.message);

    next(error);
  }
};
