import crypto from 'crypto';
import User from '../models/User.js';
import GmailCredential from '../models/GmailCredential.js';
import { encryptRefreshToken } from '../utils/gmailTokenCrypto.js';

// Minimal user shape returned for an authenticated session (password never
// included). Shared by login, getMe, and the Google sign-in.
const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  bio: user.bio,
  headline: user.headline,
  images: user.images || [],
  featuredImages: user.featuredImages || [],
});

export const login = async (req, res, next) => {
  // Password sign-in is disabled — this is a single-admin portfolio that
  // authenticates exclusively via Google OAuth. Keep the route defined only so
  // a stray form/script hitting it gets a clear answer instead of a 404.
  return res.status(403).json({
    success: false,
    message: 'Password login is disabled. Sign in with Google instead.',
  });
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateDetails = async (req, res, next) => {
  try {
    const { name, bio, headline, avatar, images, featuredImages, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (headline !== undefined) user.headline = headline;
    if (avatar !== undefined) user.avatar = avatar;
    // Wholesale set of the profile image collection. `!== undefined` preserves
    // the pass-if-present convention and — importantly — honors `[]`, so the
    // admin can clear the whole set. Non-array input is normalized to [].
    if (images !== undefined) {
      user.images = Array.isArray(images) ? images.map(String).filter(Boolean) : [];
    }
    // Same convention as `images`: wholesale set, `!== undefined` guards so `[]`
    // (clearing) works and absent keys leave the field untouched.
    if (featuredImages !== undefined) {
      user.featuredImages = Array.isArray(featuredImages) ? featuredImages.map(String).filter(Boolean) : [];
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match' });
      }
      user.password = newPassword;
    }

    await user.save();
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      message: 'Profile updated successfully',
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign in with Google (Authorization Code flow with PKCE, per Google Identity
 * Services for SPAs). The browser sends only an authorization `code`; the
 * server exchanges it with Google's token endpoint using the server-side
 * `client_secret` (never exposed to the browser), then verifies the returned
 * id_token/profile.
 *
 * Access is restricted to a single admin: the Google profile's verified email
 * MUST be in `ALLOWED_ADMIN_EMAILS` (comma-separated allowlist), otherwise we refuse with a generic 403. On
 * success we upsert the User and mint the same JWT as the password login, so
 * the client flow is identical.
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body;
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Google sign-in is not configured on the server.',
      });
    }

    // GIS popup mode requires this custom header as a CSRF defence.
    if (req.get('X-Requested-With') !== 'XmlHttpRequest') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google authorization request.',
      });
    }

    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Google authorization code is missing.',
      });
    }

    // The redirect_uri in the token exchange must be the exact origin
    // that called initCodeClient() in GIS popup mode.
    const allowedOrigins = [
      process.env.CLIENT_URL,
      ...(process.env.ALLOWED_FRONTEND_ORIGINS || '').split(','),
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]
      .filter(Boolean)
      .map((value) => {
        try {
          return new URL(value.trim()).origin;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    let exchangeRedirectUri;
    try {
      exchangeRedirectUri = new URL(redirectUri).origin;
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google redirect origin.',
      });
    }

    if (!allowedOrigins.includes(exchangeRedirectUri)) {
      return res.status(400).json({
        success: false,
        message: 'This frontend origin is not allowed.',
      });
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: exchangeRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.id_token) {
      console.error('Google token exchange failed:', {
        status: tokenRes.status,
        error: tokenData.error,
        description: tokenData.error_description,
      });
      return res.status(401).json({
        success: false,
        message: 'Google could not verify the authorization code.',
      });
    }

    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`
    );
    const profile = await infoRes.json();

    if (
      !infoRes.ok ||
      profile.aud !== GOOGLE_CLIENT_ID ||
      profile.email_verified !== 'true' ||
      !profile.email
    ) {
      return res.status(401).json({
        success: false,
        message: 'Unable to verify the Google account.',
      });
    }

    const adminEmail = profile.email.trim().toLowerCase();
    const allowedAdmins = (process.env.ALLOWED_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedAdmins.includes(adminEmail)) {
      return res.status(403).json({
        success: false,
        message: 'This Google account is not authorized to sign in.',
      });
    }

    let user = await User.findOne({ email: adminEmail }).select('+tokenVersion');

    if (!user) {
      user = await User.create({
        name: profile.name || profile.given_name || 'Admin',
        email: adminEmail,
        avatar: profile.picture || undefined,
        password: crypto.randomBytes(24).toString('hex'),
      });
    }

    // One refresh token per authorized admin. Google commonly returns a
    // refresh_token only on the first offline authorization. Never overwrite
    // a saved token with null on later logins.
    const existingCredential = await GmailCredential.findOne({
      provider: 'gmail',
      email: adminEmail,
    });

    if (tokenData.refresh_token) {
      const encrypted = encryptRefreshToken(tokenData.refresh_token);
      await GmailCredential.findOneAndUpdate(
        { provider: 'gmail', email: adminEmail },
        {
          provider: 'gmail',
          email: adminEmail,
          ...encrypted,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    const gmailConnected = Boolean(tokenData.refresh_token || existingCredential);
    const token = user.getSignedJwtToken();

    return res.status(200).json({
      success: true,
      token,
      user: serializeUser(user),
      gmailConnected,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout — bumps tokenVersion so every previously-issued JWT (including this
 * one) is rejected by `protect`. Client clears its stored token too; this is
 * the server-side backstop so a leaked/old token can be invalidated.
 */
export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
