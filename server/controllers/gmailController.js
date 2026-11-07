
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import GmailCredential from '../models/GmailCredential.js';

import {
  createGoogleOAuthClient,
  GMAIL_SCOPES,
  google,
} from '../config/googleOAuth.js';

import {
  encryptRefreshToken,
  decryptRefreshToken,
} from '../utils/gmailTokenCrypto.js';

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const getAllowedAdminEmails = () =>
  (process.env.ALLOWED_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const normalizeEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const isAllowedAdmin = (email) =>
  getAllowedAdminEmails().includes(normalizeEmail(email));

const getClientUrl = () =>
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .replace(/\/+$/, '');

const getAdminMessagesUrl = () =>
  `${getClientUrl()}/admin/messages`;

const redirectWithError = (res, reason) =>
  res.redirect(
    `${getAdminMessagesUrl()}?gmail=error&reason=${encodeURIComponent(reason)}`
  );

// --------------------------------------------------
// 1. START GMAIL OAUTH
// GET /api/messages/gmail/connect
// Protected route
// --------------------------------------------------

export const startGmailOAuth = async (req, res, next) => {
  try {
    const adminEmail = normalizeEmail(req.user?.email);

    // Only an authorized admin can connect Gmail.
    if (!adminEmail || !isAllowedAdmin(adminEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized admin account.',
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured.');
    }

    const oauth2Client = createGoogleOAuthClient();

    // Signed state binds this authorization request to the admin.
    const state = jwt.sign(
      {
        purpose: 'gmail-oauth',
        adminEmail,
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent select_account',
      scope: GMAIL_SCOPES,
      state,
    });

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
      return redirectWithError(
        res,
        'google_authorization_denied'
      );
    }

    const { code, state } = req.query;

    if (
      typeof code !== 'string' ||
      typeof state !== 'string'
    ) {
      return redirectWithError(
        res,
        'missing_code_or_state'
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing.');
      return redirectWithError(
        res,
        'server_configuration_error'
      );
    }

    // Verify signed OAuth state.
    let decoded;

    try {
      decoded = jwt.verify(state, process.env.JWT_SECRET);
    } catch {
      return redirectWithError(
        res,
        'invalid_or_expired_state'
      );
    }

    const adminEmail = normalizeEmail(decoded.adminEmail);

    if (
      decoded.purpose !== 'gmail-oauth' ||
      !adminEmail ||
      !isAllowedAdmin(adminEmail)
    ) {
      return redirectWithError(
        res,
        'unauthorized_admin'
      );
    }

    // Exchange authorization code for Google tokens.
    const oauth2Client = createGoogleOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);

    // OpenID email scope should provide an ID token.
    if (!tokens.id_token) {
      return redirectWithError(
        res,
        'missing_google_identity'
      );
    }

    // Verify the ID token with Google.
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const connectedEmail = normalizeEmail(payload?.email);

    if (
      !connectedEmail ||
      payload.email_verified !== true
    ) {
      return redirectWithError(
        res,
        'unverified_google_email'
      );
    }

    // Connected Gmail must match the logged-in admin.
    if (
      connectedEmail !== adminEmail ||
      !isAllowedAdmin(connectedEmail)
    ) {
      return redirectWithError(
        res,
        'gmail_account_mismatch'
      );
    }

    // Optional environment-level sender restriction.
    const configuredEmail = normalizeEmail(
      process.env.GMAIL_USER_EMAIL
    );

    if (
      configuredEmail &&
      configuredEmail !== connectedEmail
    ) {
      return redirectWithError(
        res,
        'configured_email_mismatch'
      );
    }

    // Find existing Gmail credential.
    const existing = await GmailCredential.findOne({
      provider: 'gmail',
    });

    // Never reuse a refresh token belonging to another Gmail account.
    const existingRefreshToken =
      existing &&
      normalizeEmail(existing.email) === connectedEmail
        ? decryptRefreshToken(existing)
        : null;

    const refreshToken =
      tokens.refresh_token || existingRefreshToken;

    if (!refreshToken) {
      return redirectWithError(
        res,
        'no_refresh_token'
      );
    }

    // Encrypt refresh token before storing it.
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

    console.log(
      `Gmail connected successfully: ${connectedEmail}`
    );

    return res.redirect(
      `${getAdminMessagesUrl()}?gmail=connected`
    );
  } catch (error) {
    console.error(
      'Gmail OAuth callback failed:',
      error.message
    );

    return redirectWithError(
      res,
      'oauth_callback_failed'
    );
  }
};

// --------------------------------------------------
// 3. GET GMAIL CONNECTION STATUS
// GET /api/messages/gmail/status
// Protected route
// --------------------------------------------------

export const getGmailStatus = async (req, res, next) => {
  try {
    const adminEmail = normalizeEmail(req.user?.email);

    if (!adminEmail || !isAllowedAdmin(adminEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized admin account.',
      });
    }

    const credential = await GmailCredential.findOne({
      provider: 'gmail',
    }).select('email updatedAt');

    // Only show connected status for the same admin account.
    const isConnected =
      Boolean(credential) &&
      normalizeEmail(credential.email) === adminEmail;

    return res.status(200).json({
      success: true,
      connected: isConnected,
      email: isConnected ? credential.email : null,
      connectedAt: isConnected
        ? credential.updatedAt
        : null,
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
    const adminEmail = normalizeEmail(req.user?.email);

    // Verify admin identity.
    if (!adminEmail || !isAllowedAdmin(adminEmail)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized admin account.',
      });
    }

    const reply =
      typeof req.body.reply === 'string'
        ? req.body.reply.trim()
        : '';

    if (!reply || reply.length > 10000) {
      return res.status(400).json({
        success: false,
        message:
          'Reply must contain between 1 and 10,000 characters.',
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

    // Validate visitor email before using it in an email header.
    const recipientEmail = normalizeEmail(message.email);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(recipientEmail) ||
      /[\r\n]/.test(message.email || '')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Visitor email address is invalid.',
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

    // Connected Gmail must match the currently logged-in admin.
    if (
      normalizeEmail(credential.email) !== adminEmail
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Connected Gmail does not match the authorized admin.',
      });
    }

    // Get decrypted refresh token.
    const refreshToken = decryptRefreshToken(credential);

    if (!refreshToken) {
      return res.status(409).json({
        success: false,
        message:
          'Gmail refresh token is missing. Reconnect Gmail.',
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
      `From: ${message.name || 'Visitor'} <${recipientEmail}>`,
      `Date: ${originalDate}`,
      `Subject: ${safeSubject}`,
      '',
      quotedOriginal,
    ].join('\n');

    // Build MIME email headers.
    const headers = [
      `From: ${credential.email}`,
      `To: ${recipientEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
    ];

    const rawMessage =
      `${headers.join('\r\n')}\r\n\r\n${body}`;

    // Gmail API requires base64url encoded MIME message.
    const raw = Buffer
      .from(rawMessage, 'utf8')
      .toString('base64url');

    // Send email through the connected Gmail account.
    const sent = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });

    // Save reply in MongoDB conversation history.
    message.replies = message.replies || [];

    message.replies.push({
      body: reply,
      from: credential.email,
      to: recipientEmail,
      sentAt: new Date(),
      gmailMessageId: sent.data.id || null,
    });

    await message.save();

    return res.status(200).json({
      success: true,
      message:
        'Reply sent successfully and saved to the conversation.',
      data: message,
    });
  } catch (error) {
    console.error(
      'Gmail reply failed:',
      error.message
    );

    next(error);
  }
};
