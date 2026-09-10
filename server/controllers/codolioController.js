/**
 * Public proxy for the owner's Codolio competitive-programming + GitHub stats.
 *
 * Codolio exposes public, CORS-open, no-auth endpoints for the CP profile and
 * the GitHub profile; GitHub's own API adds the reliable avatar + repo/follower
 * counts. We cache with a short TTL so the homepage doesn't hammer them on every
 * view and deliberately map only the fields the frontend needs. Every upstream
 * call is best-effort — on any failure we never throw to the error handler, so
 * the homepage stats band survives (falls back to stale cache or empty data).
 */
const CODOLIO_URL = 'https://api.codolio.com/profile?userKey=hkramar73';
const CODOLIO_GITHUB_URL = 'https://api.codolio.com/github/profile?userKey=hkramar73';
const GITHUB_USER_URL = 'https://api.github.com/users/HKRAmarSingh19';
const TTL = 15 * 60 * 1000; // 15 min
let cache = { ts: 0, data: null };

/** Fetch JSON best-effort; returns null on any failure so callers stay graceful. */
const fetchJson = async (url) => {
  try {
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
};

/**
 * Reduce Codolio's nested profile into the flat shape the homepage renders.
 * Per platform: identity, rating, solved-by-difficulty, topic distribution,
 * submission-activity (day ms → count), recent contests and badges.
 */
const pick = (d) => ({
  profileViews: d?.profileViews ?? 0,
  platforms: (d?.platformProfiles?.platformProfiles || []).map((p) => {
    const us = p?.userStats || {};
    const tq = p?.totalQuestionStats || {};
    const activity = p?.dailyActivityStatsResponse || {};
    return {
      platform: p.platform,
      handle: us.handle ?? null,
      rating: us.currentRating ?? null,
      maxRating: us.maxRating ?? null,
      rank: us.rank ?? null,
      stars: us.stars ?? null,
      photo: us.titlePhoto ?? null,
      total: {
        total: tq.totalQuestionCounts ?? 0,
        easy: tq.easyQuestionCounts ?? 0,
        medium: tq.mediumQuestionCounts ?? 0,
        hard: tq.hardQuestionCounts ?? 0,
        basic: tq.basicQuestionCounts ?? 0,
        school: tq.schoolQuestionCounts ?? 0,
      },
      topics: p?.topicAnalysisStats?.topicWiseDistribution || {},
      activity: {
        days: Object.entries(activity.submissionCalendar || {})
          .map(([t, c]) => ({ day: Number(t) * 1000, count: c }))
          .sort((a, b) => a.day - b.day),
        maxStreak: activity.maxStreak ?? 0,
        totalActiveDays: activity.totalActiveDays ?? 0,
      },
      contests: (p?.contestActivityStats?.contestActivityList || []).map((c) => ({
        name: c.contestName ?? '',
        rating: c.rating ?? null,
        date: c.contestDate != null ? c.contestDate * 1000 : null,
        rank: c.rank ?? null,
      })),
      badges: (p?.badgeStats?.badgeList || []).map((b) => ({
        name: b.displayName ?? b.name ?? '',
        icon: b.icon ?? null,
      })),
    };
  }),
});

/** Combine Codolio GitHub payload + GitHub user payload into a clean github object. */
const pickGithub = (gh, user) => {
  const dev = gh?.developmentActivity || {};
  return {
    handle: gh?.githubProfile ?? user?.login ?? 'HKRAmarSingh19',
    avatar: user?.avatar_url ?? null,
    repos: user?.public_repos ?? gh?.totalRepos ?? null,
    followers: user?.followers ?? null,
    stars: gh?.stars ?? 0,
    issues: gh?.issues ?? 0,
    commits: gh?.commitCounts ?? 0,
    pushRequests: gh?.pushRequestsCount ?? 0,
    totalContributions: gh?.totalContributions ?? 0,
    activeDays: gh?.totalActiveDays ?? 0,
    languages: Object.entries(gh?.languageDistributions || {}).map(([name, bytes]) => ({
      name,
      bytes,
    })),
    activity: Object.fromEntries(
      Object.entries(dev).map(([t, c]) => [Number(t) * 1000, c])
    ),
  };
};

const EMPTY = { profileViews: 0, platforms: [] };

export const getCodolioStats = async (req, res) => {
  try {
    if (cache.data && Date.now() - cache.ts < TTL) {
      return res.json({ success: true, data: cache.data, cached: true });
    }

    const [json, ghJson, ghUser] = await Promise.all([
      fetchJson(CODOLIO_URL),
      fetchJson(CODOLIO_GITHUB_URL),
      fetchJson(GITHUB_USER_URL),
    ]);

    const data = {
      ...pick(json?.data ?? {}),
      github: pickGithub(ghJson?.data ?? {}, ghUser ?? {}),
    };
    cache = { ts: Date.now(), data };
    res.json({ success: true, data, cached: false });
  } catch (e) {
    if (cache.data) return res.json({ success: true, data: cache.data, cached: true });
    res.json({ success: true, data: EMPTY });
  }
};