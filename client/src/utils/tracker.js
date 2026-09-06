/**
 * Minimal, privacy-first pageview tracker.
 *
 * Fires one best-effort POST to /api/analytics per client-side route change via
 * navigator.sendBeacon (reliable even during navigation/unmount, no response
 * awaited). A stable, random `visitorId` is kept in localStorage so the server
 * can count *unique* visitors without ever seeing a name, IP, or fingerprint.
 *
 * The API base intentionally matches the axios base the rest of the app uses
 * (see api/client.js) so this works through the same Vite proxy in dev and the
 * same VITE_API_URL origin in production.
 */
const STORAGE_KEY = 'portfolio_visitor_id';

function getVisitorId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      // crypto.randomUUID is available in every modern browser and all evergreen
      // targets this app supports; fall back to a random hex string just in case.
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // localStorage disabled (private mode / blocked) — return a session-scoped
    // random id so this visit still counts as a unique for its session.
    return 's-' + Math.random().toString(36).slice(2);
  }
}

export function trackPageView(path) {
  try {
    const endpoint = `${
      import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    }/api/analytics`;
    const payload = JSON.stringify({
      path,
      visitorId: getVisitorId(),
      referrer: document.referrer.slice(0, 500),
      region: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    });
    navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
  } catch {
    /* tracking must never break the app — silently ignore */
  }
}