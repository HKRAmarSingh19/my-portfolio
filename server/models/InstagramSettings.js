import mongoose from 'mongoose';

/**
 * Single-document settings for the Instagram feed, keyed by the fixed _id
 * 'singleton' so the whole doc is one row. This holds only RUNTIME metadata the
 * admin UI shows (username, last-synced time, sync status/error). The
 * authoritative credentials (access token, IG user id) live in server/.env, not
 * here — matching the lazy-env config-guard pattern used elsewhere.
 */
const instagramSettingsSchema = new mongoose.Schema(
  {
    // Fixed singleton key — there is always exactly one settings doc.
    _id: { type: String, default: 'singleton' },
    username: { type: String, default: '', trim: true },
    lastSyncedAt: { type: Date },
    // Sync lifecycle for the admin UI: idle | syncing | error.
    syncStatus: { type: String, enum: ['idle', 'syncing', 'error'], default: 'idle' },
    lastError: { type: String, default: '' },
    totalPosts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Return the (single) settings doc, creating it on first use.
instagramSettingsSchema.statics.getSingleton = async function () {
  const doc = await this.findById('singleton');
  if (doc) return doc;
  return this.create({ _id: 'singleton' });
};

const InstagramSettings = mongoose.model('InstagramSettings', instagramSettingsSchema);
export default InstagramSettings;
