import mongoose from 'mongoose';

/**
 * One Instagram post imported from the account owner's feed via the official
 * Meta Instagram Graph API. Media is hotlinked to Instagram's CDN (no rehosting
 * to S3) because this is a read-only feed that mirrors the account the owner
 * runs; `media_url`/`thumbnail_url` can expire, but a re-sync refreshes them.
 *
 * `igId` is the Instagram media ID and the natural upsert key: the sync path
 * bulk-writes with `upsert: true` on it, so re-syncing updates changed
 * captions/metadata without ever creating duplicates.
 */
const instagramPostSchema = new mongoose.Schema(
  {
    // Instagram media ID — unique key we upsert on.
    igId: { type: String, required: true, unique: true, trim: true },
    // IMAGE | VIDEO | CAROUSEL_ALBUM. Kept as a plain string (no strict enum)
    // so a future/unknown API media_type never rejects an insert.
    mediaType: { type: String, default: 'IMAGE' },
    // The source media asset on IG's CDN (cover asset for carousels/reels).
    mediaUrl: { type: String, default: '', trim: true },
    // Video poster thumbnail (API's thumbnail_url field); also a good image cover.
    thumbnailUrl: { type: String, default: '', trim: true },
    permalink: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true },
    // When the post was published on Instagram (not when we imported it).
    timestamp: { type: Date },
    username: { type: String, default: '', trim: true },
    // Carousel (album) children: child media URL + type. The card uses the
    // first child as a fallback cover and links out to permalink; children are
    // kept for completeness and a possible future lightbox.
    children: {
      type: [
        {
          mediaType: { type: String, default: 'IMAGE' },
          mediaUrl: { type: String, default: '', trim: true },
          permalink: { type: String, default: '', trim: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Newest-first listing is the hot path (public feed + admin list) — index it.
instagramPostSchema.index({ timestamp: -1 });

const InstagramPost = mongoose.model('InstagramPost', instagramPostSchema);
export default InstagramPost;
