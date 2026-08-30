import LinkedInPost from '../models/LinkedInPost.js';
import LinkedInSettings from '../models/LinkedInSettings.js';

/**
 * LinkedIn feed helpers — manual curation.
 *
 * Purpose: render a curated LinkedIn feed on the site. The admin pastes the URL
 * of each LinkedIn post they want shown, optionally with a short caption, and we
 * store it as a post card. This deliberately avoids every automatic-fetch path:
 * the Posts API needs the `r_member_social` scope (LinkedIn routinely denies it
 * to individuals), and public profile pages / anonymous RSS are bot-blocked
 * (HTTP 999) or login-walled. A hand-curated list is the one route that works
 * reliably for a personal portfolio with zero approval.
 *
 * Env vars are read LAZILY (inside functions, never at module load) so this
 * module is safe to import before dotenv.config() runs.
 */

/**
 * The feed is always "configured": unlike the Instagram/API variants there is no
 * external credential — the admin simply adds post links. Kept as a function so
 * the controller/meta shape stays uniform across the social feeds.
 */
export const isLinkedInConfigured = () => true;

// Optional public-profile vanity name → "View profile" link.
const vanityName = () => process.env.LINKEDIN_VANITY_NAME?.trim() || '';

/**
 * Turn a LinkedIn post URL into a stable id for the upsert key. We prefer the
 * numeric activity id embedded in the /posts/...-activity-<ID>-... path; fall
 * back to a hash of the URL so any link still yields a unique, stable key.
 */
export const deriveLinkedInId = (url) => {
  if (!url) return `custom-${Date.now()}`;
  const m = String(url).match(/activity-(\d+)/i);
  if (m?.[1]) return m[1];
  // Fall back to a numeric hash so re-adding the same URL updates, not dupes.
  let h = 0;
  for (const ch of String(url)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `url-${h}`;
};

/**
 * Derive a human-readable title from a LinkedIn post URL, so a card never shows
 * the raw URL when no caption was provided. LinkedIn /posts/ URLs carry the
 * post's slug words after the account handle, e.g.
 *   .../posts/hkr-amar-singh-270246308_adobeuniversityhackathon-adobe-unstop-activity-...
 * → we take the words after the first `_` and humanize them. Links without that
 * shape (e.g. urn:li:activity:...) fall back to a neutral label.
 */
const titleFromUrl = (url) => {
  const m = String(url).match(/posts\/[^_\/\?]+_(.+)-activity-/i);
  const words = m?.[1];
  if (!words) return '';
  return words
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const decodeEntities = (s) =>
  String(s || '')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ');

// Read the value of a single <meta property="og:..." content="..."> tag out of
// an HTML string. This is quote-aware so a `>` that appears INSIDE a quoted
// attribute value (e.g. LinkedIn captions often contain the literal text "—>")
// does not prematurely end the tag match.
const ogValue = (html, prop) => {
  if (!html) return '';
  // Quote-aware <meta ...> matcher: the tag body may contain quoted values,
  // and a quote-aware capture lets "contain >" values pass through intact.
  const tagRe = /<meta\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  let tag;
  while ((tag = tagRe.exec(html))) {
    const attrs = tag[1];
    if (!new RegExp(`\\bproperty=["']og:${prop}["']`, 'i').test(attrs)) continue;
    const m = attrs.match(/\bcontent=("([^"]*)"|'([^']*)')/i);
    if (m) return decodeEntities(m[2] || m[3] || '');
  }
  return '';
};

/**
 * Best-effort: fetch a single LinkedIn post page and pull its OpenGraph preview
 * (image, headline, description). LinkedIn serves individual post permalinks to
 * ordinary HTTP clients with these og: meta tags, so we can auto-enrich a pasted
 * link. Never throws on failure — returns an empty object so the add always
 * succeeds and falls back to the URL-derived title.
 */
export const fetchPostPreview = async (url) => {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) return {};
    const html = await res.text();
    return {
      image: ogValue(html, 'image'),
      title: ogValue(html, 'title'),
      description: ogValue(html, 'description'),
    };
  } catch {
    return {};
  }
};

/**
 * Upsert one manually curated post (keyed on the derived id) and refresh the
 * settings singleton. `publishedAt` for a manually added post is "now"; pass an
 * explicit date to preserve an author-chosen order.
 *
 * When no caption is given, we try to auto-enrich from the post page's og: meta
 * tags (title + description + image), so pasting just a URL shows the post's
 * real photo, headline and caption. All enrichment is best-effort: if the fetch
 * fails we fall back to a readable title derived from the URL — never the raw
 * URL, which only ever drives the link-out.
 * @returns {Promise<{post: object}>}
 */
export const addLinkedInPostNow = async ({ url, commentary = '' } = {}) => {
  const cleanUrl = String(url || '').trim();
  if (!cleanUrl) {
    throw new Error('A LinkedIn post URL is required.');
  }

  const settings = await LinkedInSettings.getSingleton();
  const vanity = vanityName() || settings.vanityName;

  const liId = deriveLinkedInId(cleanUrl);
  const now = new Date();

  const caption = String(commentary || '').trim();
  // Always try to auto-enrich from the post page (image, headline, caption) so
  // pasting just a link shows the full post. Best-effort: any fetch failure
  // falls back to the provided caption / URL-derived title. An admin caption,
  // when given, overrides only the text — the fetched photo is still kept.
  const preview = await fetchPostPreview(cleanUrl);

  // Caption text: admin caption wins, else the fetched description, else a
  // URL-derived title, else a neutral fallback. Never the raw URL.
  const description = caption || preview.description || '';
  const autoTitle = preview.title || titleFromUrl(cleanUrl);
  // The card headline: prefer the og:title (but strip LinkedIn's trailing
  // " | Author" suffix), else the URL-derived words, else nothing.
  const title = (autoTitle || '').replace(/\s*\|\s*[^|]*$/, '').trim();
  const displayText = description || title || 'LinkedIn post';

  const mapped = {
    liId,
    postType: preview.image ? 'image' : 'text',
    commentary: displayText,
    title,
    permalink: cleanUrl,
    contentUrl: preview.image || '',
    contentKind: preview.image ? 'image' : '',
    publishedAt: now,
    username: settings.username || vanity || '',
  };

  await LinkedInPost.updateOne(
    { liId },
    { $set: mapped, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );

  settings.lastSyncedAt = now;
  settings.vanityName = vanity || settings.vanityName;
  settings.totalPosts = await LinkedInPost.countDocuments();
  await settings.save();

  return { post: mapped };
};
