import mongoose from 'mongoose';

/**
 * One pageview from the public site. Deliberately privacy-safe: we never store
 * an IP address, fingerprint, or any PII. `visitorId` is a random UUID generated
 * client-side (kept in localStorage) so we can count uniques without ever
 * knowing who a visitor is. `region` is the visitor's IANA timezone as a
 * stand-in for geography (e.g. "Asia/Kolkata") — no IP geolocation involved.
 *
 * Written by the public POST /api/analytics endpoint (rate-limited), read by the
 * admin-only GET /api/analytics/overview aggregations. Pure append-only log:
 * nothing here is ever updated or deleted.
 */
const pageViewSchema = new mongoose.Schema(
  {
    // Route the visitor viewed, e.g. "/projects/my-slug".
    path: { type: String, required: true, trim: true },
    // Client-generated UUID (localStorage `portfolio_visitor_id`).
    visitorId: { type: String, trim: true },
    // document.referrer — the page they came from ('' for direct/typed-in).
    referrer: { type: String, default: '', trim: true },
    // Detected from the User-Agent header server-side.
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'bot'], default: 'desktop' },
    browser: { type: String, default: 'unknown', trim: true },
    os: { type: String, default: 'unknown', trim: true },
    // Visitor's IANA timezone reported by Intl.DateTimeFormat().resolvedOptions().timeZone.
    region: { type: String, default: '', trim: true },
    // When the view happened (server-side; not mongoose timestamps, which would
    // record insert time — this IS the insert, but keeping an explicit field
    // matches the aggregation pitfall of depending on implicit _id/.timestamps).
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hot read paths are aggregations filtered by time, path, and visitorId.
pageViewSchema.index({ timestamp: -1 });
pageViewSchema.index({ path: 1, timestamp: -1 });
pageViewSchema.index({ visitorId: 1, timestamp: -1 });

const PageView = mongoose.model('PageView', pageViewSchema);
export default PageView;