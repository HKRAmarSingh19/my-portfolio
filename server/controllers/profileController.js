import User from '../models/User.js';

/**
 * Shipped with the client as `client/public/profile.jpeg`, so the portrait
 * renders even before the admin uploads a replacement (or before the DB is
 * seeded at all).
 */
export const DEFAULT_AVATAR = '/profile.jpeg';

/**
 * Public read of the owner's presentable details. Deliberately narrow — the
 * portfolio front-end needs a portrait, a name and a blurb, and nothing here
 * may leak email, role or credentials.
 */
export const getPublicProfile = async (req, res, next) => {
  try {
    // Oldest admin wins, so adding a second account can't hijack the homepage.
    const owner = await User.findOne({ role: 'admin' })
      .sort({ createdAt: 1 })
      .select('name avatar bio');

    res.status(200).json({
      success: true,
      data: {
        name: owner?.name || 'Amar Singh',
        avatar: owner?.avatar || DEFAULT_AVATAR,
        bio: owner?.bio || '',
      },
    });
  } catch (error) {
    next(error);
  }
};
