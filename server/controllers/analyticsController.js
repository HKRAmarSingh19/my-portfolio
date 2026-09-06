import PageView from '../models/PageView.js';
import { parseUserAgent } from '../utils/parseUA.js';

/**
 * Public POST /api/analytics — called via navigator.sendBeacon on client route
 * changes. Swallows errors so tracking can never degrade the browsing experience:
 * a failed beacon just logs and 200s anyway (sendBeacon itself ignores the body).
 *
 * Data cleanup is done for both correctness and DWIM-resistance: /admin paths are
 * dropped, query strings are already absent in a React SPA, visitorId is
 * length-capped, and anything optional (referrer, region) is kept but truncated
 * to a sane max length so a hostile caller can't store megabytes per row.
 */
export const trackPageView = async (req, res) => {
  try {
    const { path, visitorId, referrer = '', region = '' } = req.body || {};

    // Ignore admin/tracker self-traffic and anything not a plausible path.
    if (!path || typeof path !== 'string' || path.startsWith('/admin')) {
      return res.status(200).json({ success: true }); // just drop it silently
    }

    const parsed = parseUserAgent(req.headers['user-agent']);

    const clean = {
      path: path.slice(0, 300),
      visitorId: typeof visitorId === 'string' ? visitorId.slice(0, 64) : '',
      referrer: String(referrer).slice(0, 500),
      region: String(region).slice(0, 100),
      ...parsed,
    };

    await PageView.create(clean);
    res.status(200).json({ success: true });
  } catch (error) {
    // Log for debugging, never fail the response — analytics is best-effort.
    res.status(200).json({ success: true });
    console.warn('[analytics] trackPageView failed:', error.message);
  }
};

/**
 * Admin-only GET /api/analytics/overview?range=7d|30d|90d|all
 *
 * A single Mongo aggregation across the PageView collection returns every slice
 * the dashboard needs. `range` filters on `timestamp`; "all" omits the match
 * stage. Aggregations are grouped:
 *   - views total, unique visitors
 *   - views per day (for the recharts area chart)
 *   - top pages, top referrers
 *   - deviceType / browser / OS / time-of-day distributions
 */
const RANGE_DAYS = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const { range = '7d' } = req.query;
    const days = RANGE_DAYS[range] ?? null;

    const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
    const match = since ? { timestamp: { $gte: since } } : {};

    // Start of today (server-local) for the "views today" stat — shown regardless
    // of the selected range so it always reflects the most recent real signal.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totals, todayCount, viewsByDay, topPages, topReferrers, devices, browsers, osBreakdown, viewsByHour, topRegions] =
      await Promise.all([
        // Total views + unique visitors within range.
        PageView.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalViews: { $sum: 1 },
              uniqueVisitors: { $addToSet: '$visitorId' },
            },
          },
          { $project: { _id: 0, totalViews: 1, uniqueVisitors: { $size: '$uniqueVisitors' } } },
        ]),

        // Views today (independent of range filter).
        PageView.countDocuments({ timestamp: { $gte: startOfToday } }),

        // Views per calendar day (server-local time).
        PageView.aggregate([
          { $match: match },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Top 10 most-viewed pages.
        PageView.aggregate([
          { $match: match },
          { $group: { _id: '$path', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),

        // Top referrers, excluding direct/none traffic.
        PageView.aggregate([
          { $match: { ...match, referrer: { $ne: '' } } },
          { $group: { _id: '$referrer', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),

        PageView.aggregate([
          { $match: match },
          { $group: { _id: '$deviceType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        PageView.aggregate([
          { $match: match },
          { $group: { _id: '$browser', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),

        PageView.aggregate([
          { $match: match },
          { $group: { _id: '$os', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),

        // Views bucketed by hour of day (0–23 local server time).
        PageView.aggregate([
          { $match: match },
          { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),

        // Top timezones (privacy-safe "region" proxy from the browser).
        PageView.aggregate([
          { $match: { ...match, region: { $ne: '' } } },
          { $group: { _id: '$region', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

    // Normalise the aggregations into the flat shape the dashboard consumes.
    const fmtDist = (rows) => rows.map((r) => ({ label: r._id || 'unknown', count: r.count }));

    res.status(200).json({
      success: true,
      data: {
        range,
        totalViews: totals[0]?.totalViews ?? 0,
        uniqueVisitors: totals[0]?.uniqueVisitors ?? 0,
        viewsToday: todayCount,
        viewsByDay: viewsByDay.map((d) => ({ date: d._id, count: d.count })),
        topPages: fmtDist(topPages),
        topReferrers: fmtDist(topReferrers),
        devices: fmtDist(devices),
        browsers: fmtDist(browsers),
        osBreakdown: fmtDist(osBreakdown),
        viewsByHour: viewsByHour.map((h) => ({ hour: h._id, count: h.count })),
        regions: fmtDist(topRegions),
      },
    });
  } catch (error) {
    next(error);
  }
};