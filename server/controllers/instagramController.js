import InstagramPost from '../models/InstagramPost.js';
import InstagramSettings from '../models/InstagramSettings.js';
import { isInstagramConfigured, syncInstagramNow } from '../config/instagram.js';

/**
 * Public: list stored Instagram posts, newest first.
 */
export const getInstagramPosts = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const numLimit = Math.min(Number(limit) || 50, 200);

    const posts = await InstagramPost.find({})
      .sort({ timestamp: -1, createdAt: -1 })
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
 * Public: lightweight feed metadata (username, last-sync time, total) used for
 * the header/subtitle and the admin "last synced" label.
 */
export const getInstagramMeta = async (req, res, next) => {
  try {
    const settings = await InstagramSettings.findById('singleton').lean();
    res.status(200).json({
      success: true,
      data: {
        configured: isInstagramConfigured(),
        username: settings?.username || '',
        lastSyncedAt: settings?.lastSyncedAt || null,
        totalPosts: settings?.totalPosts ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin (behind protect): trigger a full fetch + upsert from Instagram.
 */
export const syncInstagram = async (req, res, next) => {
  try {
    if (!isInstagramConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Instagram is not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID in server/.env.',
      });
    }

    const settings = await InstagramSettings.getSingleton();
    settings.syncStatus = 'syncing';
    settings.lastError = '';
    await settings.save();

    const result = await syncInstagramNow();

    settings.syncStatus = 'idle';
    await settings.save();

    res.status(200).json({
      success: true,
      message: `Synced ${result.synced} posts (${result.total} stored).`,
      count: result.total,
      data: { synced: result.synced, total: result.total, lastSyncedAt: result.lastSyncedAt },
    });
  } catch (error) {
    // Record the failure on the singleton so the admin UI can show it, then
    // rethrow so the response 500s via the central errorHandler.
    try {
      const settings = await InstagramSettings.findById('singleton');
      if (settings) {
        settings.syncStatus = 'error';
        settings.lastError = error.message;
        await settings.save();
      }
    } catch {
      /* ignore settings write failure */
    }
    next(error);
  }
};

/**
 * Admin (behind protect): remove a single imported post (hide from the feed).
 * Accepts either the Mongo _id or the Instagram media id.
 */
export const deleteInstagramPost = async (req, res, next) => {
  try {
    const filter = req.params.id?.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { igId: req.params.id };

    const post = await InstagramPost.findOneAndDelete(filter);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Instagram post not found',
      });
    }
    res.status(200).json({
      success: true,
      message: 'Instagram post removed.',
    });
  } catch (error) {
    next(error);
  }
};
