
import { google } from 'googleapis';

export const GMAIL_SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.send',
];

export const createGoogleOAuthClient = () => {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GMAIL_REDIRECT_URI,
  } = process.env;

  if (
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GMAIL_REDIRECT_URI
  ) {
    throw new Error(
      'Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GMAIL_REDIRECT_URI.'
    );
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
  );
};

export { google };
