import mongoose from 'mongoose';

/**
 * One LinkedIn post imported from the account owner's profile via the official
 * LinkedIn API (Posts API "Find Posts by Author"). Unlike Instagram, LinkedIn
 * posts do not expose a stable, directly-hotlinkable image URL — a separate,
 * restricted Images/Videos API call is needed. So `contentUrl` is a BEST-EFFORT
 * thumbnail (empty when unresolved); the reliable display is text + link-out.
 *
 * `liId` is the LinkedIn post id (e.g. the numeric tail of `urn:li:share:{id}`
 * / `urn:li:ugcPost:{id}`) and the natural upsert key: the sync path
 * bulk-writes with `upsert: true` on it, so re-syncing updates changed
 * commentary/metadata without ever creating duplicates.
 */
const linkedInPostSchema = new mongoose.Schema(
  {
    // LinkedIn post id — unique key we upsert on (the URN id part).
    liId: { type: String, required: true, unique: true, trim: true },
    // text | image | video | document | article | ... Kept as a plain string
    // (no strict enum) so a future/unknown type never rejects an insert.
    postType: { type: String, default: 'text' },
    // The post body/commentary text.
    commentary: { type: String, default: '', trim: true },
    // A short headline for the card, when available. We try to auto-derive it
    // from LinkedIn's og:title; falls back to '' (card shows only commentary).
    title: { type: String, default: '', trim: true },
    // Best-effort resolved thumbnail URL ('' when not resolvable).
    contentUrl: { type: String, default: '', trim: true },
    // What contentUrl holds, when set: '' | 'image' | 'video'.
    contentKind: { type: String, default: '', trim: true },
    // Canonical LinkedIn post URL.
    permalink: { type: String, default: '', trim: true },
    // When the post was published on LinkedIn (not when we imported it).
    publishedAt: { type: Date },
    username: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

// Newest-first listing is the hot path (public feed + admin list) — index it.
linkedInPostSchema.index({ publishedAt: -1 });

const LinkedInPost = mongoose.model('LinkedInPost', linkedInPostSchema);
export default LinkedInPost;
