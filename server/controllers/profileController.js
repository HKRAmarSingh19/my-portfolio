import User from '../models/User.js';

/**
 * The default profile photo was removed — there is no bundled portrait anymore.
 * When no avatar is set the client renders a neutral initials box (and the
 * featured-photo carousel takes over when featured images exist).
 */
export const DEFAULT_AVATAR = '';

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
      .select('name avatar bio headline images featuredImages');

    res.status(200).json({
      success: true,
      data: {
        name: owner?.name || 'Amar Singh',
        avatar: owner?.avatar || DEFAULT_AVATAR,
        bio: owner?.bio || '',
        headline: owner?.headline || 'Full-Stack Software Engineer',
        images: owner?.images || [],
        featuredImages: owner?.featuredImages || [],
      },
    });
  } catch (error) {
    next(error);
  }
};
