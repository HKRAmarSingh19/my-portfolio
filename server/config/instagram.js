import InstagramPost from '../models/InstagramPost.js';
import InstagramSettings from '../models/InstagramSettings.js';

/**
 * Instagram Graph API client + feed sync helpers.
 *
 * Purpose: pull the account owner's Instagram posts (official Graph API) into
 * the local DB so the site can render an Instagram feed. Transcoding/etc. lives
 * elsewhere — this module is purely "fetch media list from Instagram, upsert
 * into Mongo."
 *
 * The account must be a professional (Business/Creator) account and the token a
 * long-lived (60-day, refreshable) access token. Env vars are read LAZILY
 * (inside functions, never at module load) so this module is safe to import
 * before dotenv.config() runs — mirroring config/s3.js and config/mediaconvert.js.
 *
 * Opt-in: nothing does work unless INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID
 * are set in server/.env. Without them the app works exactly as before and the
 * feed simply stays empty.
 */

const GRAPH_VERSION = () => process.env.INSTAGRAM_GRAPH_API_VERSION || 'v22.0';
const BASE = () => `https://graph.facebook.com/${GRAPH_VERSION()}`;

/** True only when the Instagram feed is fully configured to sync. */
export const isInstagramConfigured = () =>
  !!(process.env.INSTAGRAM_ACCESS_TOKEN?.length && process.env.INSTAGRAM_USER_ID?.length);

/**
 * Fetch ALL media for the configured IG user, following cursor pagination
 * (paging.cursors.after) to exhaustion. Returns a flat array of raw Graph media
 * objects (with nested `children.data` for carousels). Throws a readable error
 * on any non-OK Graph response.
 */
export const fetchAllInstagramMedia = async ({ limit = 50 } = {}) => {
  if (!isInstagramConfigured()) {
    throw new Error('Instagram is not configured (set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID).');
  }

  const fields = [
    'id',
    'media_type',
    'media_url',
    'permalink',
    'caption',
    'timestamp',
    'thumbnail_url',
    // children{...} returns a carousel's child media.
    'children{media_url,media_type,permalink}',
  ].join(',');

  const all = [];
  let cursor;
  let page = 0;
  const maxPages = 20; // hard cap (20 * 50 = 1000 posts) so an infinite loop is impossible

  do {
    const params = new URLSearchParams({
      fields,
      limit: String(limit),
      access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
    });
    if (cursor) params.set('after', cursor);

    const res = await fetch(`${BASE()}/${process.env.INSTAGRAM_USER_ID}/media?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      const msg = data?.error?.message || data?.error?.code || 'Instagram Graph API error';
      throw new Error(`Instagram sync failed: ${msg}`);
    }

    const pageData = data.data || [];
    all.push(...pageData);

    cursor = data.paging?.cursors?.after; // next-page cursor
    page += 1;
    if (!cursor || !pageData.length) break;
  } while (page < maxPages);

  // The API can include a trailing cursor on the last page; dedupe by id.
  const seen = new Set();
  return all.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
};

// Map one raw Graph media object to our schema shape (children flattened).
const mapMedia = (raw) => {
  const children = Array.isArray(raw.children?.data)
    ? raw.children.data.map((c) => ({
        mediaType: c.media_type,
        mediaUrl: c.media_url || '',
        permalink: c.permalink || '',
      }))
    : [];

  return {
    igId: String(raw.id),
    mediaType: raw.media_type || 'IMAGE',
    mediaUrl: raw.media_url || '',
    thumbnailUrl: raw.thumbnail_url || '',
    permalink: raw.permalink || '',
    caption: raw.caption || '',
    timestamp: raw.timestamp ? new Date(raw.timestamp) : undefined,
    children,
  };
};

/**
 * Fetch the feed and upsert every post into Mongo (idempotent, keyed on igId),
 * then update the settings singleton. Exported so both the admin sync controller
 * and the server-boot best-effort sync share one pipeline.
 * @returns {Promise<{synced: number, total: number, lastSyncedAt: Date}>}
 */
export const syncInstagramNow = async () => {
  if (!isInstagramConfigured()) {
    throw new Error('Instagram is not configured (set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID).');
  }

  const settings = await InstagramSettings.getSingleton();
  const username = settings.username;

  const rawMedia = await fetchAllInstagramMedia();

  const ops = rawMedia.map((raw) => {
    const mapped = mapMedia(raw);
    mapped.username = username;
    return {
      updateOne: {
        filter: { igId: mapped.igId },
        update: { $set: mapped },
        upsert: true,
      },
    };
  });

  if (ops.length) {
    await InstagramPost.bulkWrite(ops, { ordered: false });
  }

  const lastSyncedAt = new Date();
  settings.lastSyncedAt = lastSyncedAt;
  settings.totalPosts = rawMedia.length;
  await settings.save();

  const total = await InstagramPost.countDocuments();
  return { synced: rawMedia.length, total, lastSyncedAt };
};
