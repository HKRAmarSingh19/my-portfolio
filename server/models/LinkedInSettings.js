import mongoose from 'mongoose';

/**
 * Single-document settings for the LinkedIn feed, keyed by the fixed _id
 * 'singleton' so the whole doc is one row. This holds only RUNTIME metadata the
 * admin UI shows (username, vanity name, last-synced time, sync status/error).
 * The authoritative credential (access token) lives in server/.env, not here —
 * matching the lazy-env config-guard pattern used elsewhere.
 */
const linkedInSettingsSchema = new mongoose.Schema(
  {
    // Fixed singleton key — there is always exactly one settings doc.
    _id: { type: String, default: 'singleton' },
    username: { type: String, default: '', trim: true },
    // The public profile vanity name → https://www.linkedin.com/in/{vanityName}.
    vanityName: { type: String, default: '', trim: true },
    lastSyncedAt: { type: Date },
    // Sync lifecycle for the admin UI: idle | syncing | error.
    syncStatus: { type: String, enum: ['idle', 'syncing', 'error'], default: 'idle' },
    lastError: { type: String, default: '' },
    totalPosts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Return the (single) settings doc, creating it on first use.
linkedInSettingsSchema.statics.getSingleton = async function () {
  const doc = await this.findById('singleton');
  if (doc) return doc;
  return this.create({ _id: 'singleton' });
};

const LinkedInSettings = mongoose.model('LinkedInSettings', linkedInSettingsSchema);
export default LinkedInSettings;
