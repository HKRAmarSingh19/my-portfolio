import crypto from 'crypto';
import User from '../models/User.js';

// Minimal user shape returned for an authenticated session (password never
// included). Shared by login, getMe, and the Google sign-in.
const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  bio: user.bio,
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
    const { name, email, bio, avatar, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

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

    // 1. Exchange the authorization code for tokens using the server-side secret.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) {
      return res.status(401).json({
        success: false,
        message: 'Google could not verify the authorization code.',
      });
    }

    // 2. Validate the id_token with Google's tokeninfo endpoint (dependency-free;
    //    no need to ship Google's public certs or do manual JWT/RSA verification).
    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`
    );
    const profile = await infoRes.json();
    if (!infoRes.ok || profile.email_verified !== 'true' || !profile.email) {
      return res.status(401).json({
        success: false,
        message: 'Unable to verify the Google account.',
      });
    }

    // 3. The allowlist gate: verified email must be in ALLOWED_ADMIN_EMAILS (a
    //    comma-separated list of the only accounts permitted). Don't reveal the
    //    expected addresses on failure. Empty/missing list => nobody may log in.
    const allowed = (process.env.ALLOWED_ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!allowed.includes(profile.email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        message: 'This Google account is not authorized to sign in.',
      });
    }

    // 4. Upsert the admin user (single admin — match on email). A brand-new
    //    Google sign-in creates the user with a random, unusable password, so
    //    the password field is never empty and bcrypt-hashing stays consistent.
    let user = await User.findOne({ email: profile.email }).select('+tokenVersion');
    if (!user) {
      user = await User.create({
        name: profile.name || profile.given_name || 'Admin',
        email: profile.email,
        avatar: profile.picture || undefined,
        // Random password: this admin signs in via Google, not a password.
        password: crypto.randomBytes(24).toString('hex'),
      });
    }

    const token = user.getSignedJwtToken();
    res.status(200).json({
      success: true,
      token,
      user: serializeUser(user),
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
