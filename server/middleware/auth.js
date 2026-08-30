import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Shared JWT secret — required. The server is configured to refuse to boot
// without it (see server.js), so a hardcoded fallback is never acceptable here.
const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add a strong secret to server/.env before starting the server.');
  }
  return secret;
};

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, getSecret());
    // Include tokenVersion (select:false by default) so the revocation check
    // below can compare it against the JWT payload instead of comparing
    // against `undefined` (which would 401 every valid token).
    const user = await User.findById(decoded.id).select('-password +tokenVersion');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Token-revocation check: if this token was signed with an older
    // tokenVersion (i.e. the account was logged out since signing), reject it.
    if (typeof decoded.tokenVersion === 'number' && decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.',
    });
  }
};
