import { UAParser } from 'ua-parser-js';

/**
 * Classify a request's User-Agent into the coarse device/browser/OS buckets the
 * analytics dashboard aggregates on. Returns a flat object safe to store in a
 * PageView doc. Bots (crawlers, monitor pings like the UptimeRobot keep-alive)
 * are bucketed as `bot` so real visitor stats aren't polluted.
 */
export function parseUserAgent(userAgentHeader = '') {
  if (!userAgentHeader || typeof userAgentHeader !== 'string') {
    return { deviceType: 'bot', browser: 'unknown', os: 'unknown' };
  }

  const ua = new UAParser(userAgentHeader);
  const deviceType = ua.getDevice().type; // '', 'mobile', 'tablet', ...
  const raw = userAgentHeader.toLowerCase();
  let browserName = ua.getBrowser().name || 'unknown';
  const osName = ua.getOS().name || 'unknown';

  // ua-parser-js mislabels Firefox as "WebKit" on some UA strings (Firefox ships
  // an AppleWebKit token for compatibility and some versions of the parser take
  // it literally). The literal `firefox/` fragment is unambiguous — give it
  // priority whenever present.
  if (raw.includes('firefox/')) browserName = 'Firefox';

  let deviceBucket = 'desktop';
  if (deviceType === 'mobile') deviceBucket = 'mobile';
  else if (deviceType === 'tablet') deviceBucket = 'tablet';

  // Straightforward bot signals not covered by UAParser's device.type.
  const isBot =
    /bot|crawl|spider|preview|uptimerobot|statuscake|pingdom|curl|wget|slurp|scrape|monitor/i.test(raw) ||
    /browsershot|facebookexternalhit|twitterbot|linkedinbot/i.test(raw);

  return {
    deviceType: isBot ? 'bot' : deviceBucket,
    browser: isBot ? 'bot' : browserName,
    os: isBot ? 'bot' : osName,
  };
}