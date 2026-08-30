import LinkedInPost from '../models/LinkedInPost.js';
import LinkedInSettings from '../models/LinkedInSettings.js';
import { isLinkedInConfigured, addLinkedInPostNow } from '../config/linkedin.js';

/**
 * Public: list stored LinkedIn posts, newest first.
 */
export const getLinkedInPosts = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const numLimit = Math.min(Number(limit) || 50, 200);

    const posts = await LinkedInPost.find({})
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(numLimit);

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public: lightweight feed metadata (username, last-added time, total) used for
 * the header/subtitle and the admin "last updated" label.
 */
export const getLinkedInMeta = async (req, res, next) => {
  try {
    const settings = await LinkedInSettings.findById('singleton').lean();
    res.status(200).json({
      success: true,
      data: {
        configured: isLinkedInConfigured(),
        username: settings?.username || '',
        vanityName: settings?.vanityName || '',
        lastSyncedAt: settings?.lastSyncedAt || null,
        totalPosts: settings?.totalPosts ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin (behind protect): add one manually curated LinkedIn post from a pasted
 * URL (optionally with a short caption). The post stays on LinkedIn; we just
 * render a text-forward card that links out to it.
 */
export const addLinkedInPost = async (req, res, next) => {
  try {
    const { url = '', commentary = '' } = req.body || {};
    if (!String(url || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'A LinkedIn post URL is required.',
      });
    }

    const { post } = await addLinkedInPostNow({ url, commentary });

    res.status(201).json({
      success: true,
      message: 'LinkedIn post added to the feed.',
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin (behind protect): remove a single imported post (hide from the feed).
 * Accepts either the Mongo _id or the derived LinkedIn post id.
 */
export const deleteLinkedInPost = async (req, res, next) => {
  try {
    const filter = req.params.id?.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { liId: req.params.id };

    const post = await LinkedInPost.findOneAndDelete(filter);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'LinkedIn post not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'LinkedIn post removed.',
    });
  } catch (error) {
    next(error);
  }
};
