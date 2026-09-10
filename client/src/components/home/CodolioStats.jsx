import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Code2, Flame, BarChart3, Trophy, Github } from 'lucide-react';
import { SITE } from '../../constants/site';
import AnimatedText from '../common/AnimatedText';
import Counter from '../common/Counter';

/**
 * Visual "live coding stats" section fed by the Codolio profile API.
 *
 * A full-width merged card leads with TOTAL solved across platforms plus a
 * compact contest summary (total contests + per-platform breakdown), then a
 * 365-day contribution heatmap (each day coloured by whichever platform had the
 * most activity that day) and streak/active-day counters.
 * Below, a GitHub circular badge + a rating card per platform. Pure CSS/Tailwind.
 */

const PLATFORM_LABEL = {
  leetcode: 'LeetCode',
  codechef: 'CodeChef',
  codeforces: 'Codeforces',
  geeksforgeeks: 'GeeksforGeeks',
};

// Profile URL for a platform (opened on hover-click). Falls back to Codolio.
const platformUrl = (p) => {
  const h = p?.handle;
  const map = {
    leetcode: h ? `https://leetcode.com/u/${h}` : null,
    codechef: h ? `https://www.codechef.com/users/${h}` : null,
    codeforces: h ? `https://codeforces.com/profile/${h}` : null,
    geeksforgeeks: h ? `https://auth.geeksforgeeks.org/user/${h}` : null,
  };
  return map[p?.platform] || SITE.socials.codolio;
};

/** LeetCode brand logo (the "circle-L"). */
const LeetCodeMark = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.449 1.476.355 1.925-.238.28-.37.438-.85.438-1.34a1.91 1.91 0 0 0-.438-1.155l-3.501-2.831a4.92 4.92 0 0 0-3.741-1.5c-.84 0-1.665.16-2.447.46l4.5-4.006a1.375 1.375 0 0 0 .097-1.94A1.374 1.374 0 0 0 13.483 0z" />
  </svg>
);

/** CodeChef brand logo roundel. */
const CodeChefMark = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <circle cx="12" cy="12" r="11" fill="#5c3317" />
    <text x="12" y="17" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="Arial">CC</text>
  </svg>
);

/** Codeforces brand logo. */
const CodeforcesMark = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <rect x="2.5" y="14" width="4.5" height="7" rx="1" fill="#1f8acb" />
    <rect x="9.5" y="9" width="4.5" height="12" rx="1" fill="#fff" stroke="#aeb4c2" />
    <rect x="16.5" y="2" width="4.5" height="19" rx="1" fill="#d56c00" />
  </svg>
);

/** A platform's brand mark; falls back to its photo. */
const PlatformLogo = ({ platform, photo, className = 'h-6 w-6' }) => {
  // Always use the platform's brand logo (not the user's photo).
  if (platform === 'leetcode') return <LeetCodeMark className={className} />;
  if (platform === 'codechef') return <CodeChefMark className={className} />;
  if (platform === 'codeforces') return <CodeforcesMark className={className} />;
  if (photo) return <Avatar src={photo} alt={platform} size="sm" />;
  return <Code2 className={className} />;
};

const fmtDate = (ms) =>
  ms ? new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

/**
 * Build a LeetCode/GitHub-style 365-day contribution matrix:
 * weeks as columns (each column = one Sun-Sat week), each cell a day.
 * Returns { weeks, monthLabels }.
 */
const heatmapGrid = (dayMap, days = 365) => {
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    cells.push({ key, date: d, count: dayMap[key] || 0 });
  }
  const weeks = [];
  let cur = { monthLabel: null, cells: [] };
  for (const c of cells) {
    if (cur.cells.length === 0) {
      cur.monthLabel = c.date.toLocaleDateString(undefined, { month: 'short' });
    }
    cur.cells.push(c);
    if (cur.cells.length === 7) {
      weeks.push(cur);
      cur = { monthLabel: null, cells: [] };
    }
  }
  if (cur.cells.length) weeks.push(cur);

  const monthLabels = [];
  let lastLabel = null;
  weeks.forEach((w, i) => {
    if (w.monthLabel && w.monthLabel !== lastLabel) {
      monthLabels.push({ col: i, label: w.monthLabel });
      lastLabel = w.monthLabel;
    }
  });

  return { weeks, monthLabels };
};

// Avatar size classes.
const AVATAR_SIZES = {
  sm: 'h-9 w-9',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
};
const Avatar = ({ src, alt = '', size = 'sm' }) => {
  const [failed, setFailed] = useState(false);
  const cls = AVATAR_SIZES[size] || AVATAR_SIZES.sm;
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${cls} rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10`}
      />
    );
  }
  return (
    <div className={`${cls} grid place-items-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400`}>
      <Code2 className="h-4 w-4" />
    </div>
  );
};

// Each platform's contribution-heatmap color (distinct per platform).
const PLATFORM_HEAT = {
  leetcode: 'bg-indigo-500',
  codechef: 'bg-violet-500',
  codeforces: 'bg-sky-500',
  geeksforgeeks: 'bg-emerald-500',
  github: 'bg-neutral-500 dark:bg-neutral-400',
};

/** LeetCode circular solved graph: concentric Easy/Med/Hard rings, total in centre. */
const LeetCodeCircle = ({ leet }) => {
  if (!leet?.total) return null;
  const total = leet.total.total || 0;
  const diff = [
    { key: 'easy', label: 'Easy', value: leet.total.easy || 0, color: '#22c55e' },
    { key: 'medium', label: 'Med', value: leet.total.medium || 0, color: '#f59e0b' },
    { key: 'hard', label: 'Hard', value: leet.total.hard || 0, color: '#ef4444' },
  ];
  const SIZE = 176;
  const strokes = [13, 10, 7];
  const rings = diff.map((d, i) => {
    const radius = SIZE / 2 - strokes[i] / 2 - i * 10 - 5;
    const circumference = 2 * Math.PI * radius;
    const pct = total ? (d.value / total) * 100 : 0;
    const filled = circumference * (1 - pct / 100);
    return { ...d, radius, circumference, filled, stroke: strokes[i] };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full blur-2xl opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2), transparent 70%)' }}
        />
        <svg width={SIZE} height={SIZE} className="relative -rotate-90" aria-hidden="true">
          {rings.map((r, i) => (
            <g key={r.key}>
              <circle
                cx={SIZE / 2} cy={SIZE / 2} r={r.radius}
                fill="none" strokeWidth={r.stroke}
                className="stroke-neutral-200 dark:stroke-neutral-800"
              />
              <motion.circle
                cx={SIZE / 2} cy={SIZE / 2} r={r.radius}
                fill="none" strokeWidth={r.stroke} strokeLinecap="round"
                stroke={r.color}
                style={{ filter: `drop-shadow(0 0 3px ${r.color}55)` }}
                strokeDasharray={r.circumference}
                initial={{ strokeDashoffset: r.circumference }}
                whileInView={{ strokeDashoffset: r.filled }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              />
            </g>
          ))}
        </svg>
        {/* Centre: LeetCode total solved — crisp, no backdrop blur */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-full bg-white/70 dark:bg-neutral-950/70">
          <span className="font-mono text-[9px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            LeetCode
          </span>
          <span className="mt-0.5 text-3xl font-display font-extrabold text-neutral-900 dark:text-white tabular-nums">
            <Counter value={total} />
          </span>
          <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">solved</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {rings.map((r) => (
          <span key={r.key} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            <span className="h-2 w-2 rounded-full" style={{ background: r.color, boxShadow: `0 0 4px ${r.color}` }} />
            {r.label} <span className="tabular-nums">{r.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/** Merged card: TOTAL solved + contest summary + 365-day heatmap + streak/day counters. */
const TotalCard = ({ platforms, leet, github, others }) => {
  const solved = platforms.filter((p) => p.platform !== 'geeksforgeeks' && p.total?.total);
  if (!solved.length && !leet) return null;
  const grand = solved.reduce((a, p) => a + p.total.total, 0);

  // Contest summary: total contests + per-platform breakdown.
  const contestColors = { leetcode: '#6366f1', codechef: '#a855f7', codeforces: '#0ea5e9' };
  const contestPlatforms = platforms
    .filter((p) => contestColors[p.platform] && (p.contests || []).length)
    .map((p) => ({
      label: PLATFORM_LABEL[p.platform] || p.platform,
      color: contestColors[p.platform],
      count: (p.contests || []).filter((c) => c.rating != null).length,
    }));
  const totalContests = contestPlatforms.reduce((a, p) => a + p.count, 0);

  const toDayMap = (days) => {
    const m = {};
    for (const d of days || []) {
      const dt = new Date(d.day ?? d);
      m[`${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`] = d.count ?? 1;
    }
    return m;
  };
  const ghMap = github?.activity
    ? Object.entries(github.activity).reduce((m, [t, c]) => {
        const dt = new Date(Number(t));
        m[`${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`] = c;
        return m;
      }, {})
    : {};

  // All sources for the heatmap: LC/CC/CF + GitHub (each a distinct colour).
  const sources = [
    ...(leet ? [{ platform: 'leetcode', map: toDayMap(leet.activity?.days) }] : []),
    ...(others || []).map((p) => ({ platform: p.platform, map: toDayMap(p.activity?.days) })),
    { platform: 'github', map: ghMap },
  ].filter((s) => Object.keys(s.map).length);

  // Dominant source per day over 365 days.
  const sourceMap = {};
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let best = null;
    let bestCount = 0;
    for (const { platform, map } of sources) {
      const c = map[key] || 0;
      if (c > bestCount) {
        bestCount = c;
        best = platform;
      }
    }
    sourceMap[key] = best;
  }
  const { weeks, monthLabels } = heatmapGrid(sourceMap, 365);

  // Combined active days = unique days where ANY platform had activity.
  const activeDays = new Set();
  for (const { map } of sources) {
    for (const [day, count] of Object.entries(map)) {
      if (count) activeDays.add(day);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative rounded-2xl glass overflow-hidden hover:border-indigo-500/40 transition-colors"
      style={{ padding: '2rem 1.25rem 1.5rem' }}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Total + contest summary side by side */}
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-center md:gap-10">
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
          <span className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            <Trophy className="h-4 w-4" />
            Total Problems Solved
          </span>
          <span className="text-5xl sm:text-6xl font-display font-extrabold text-neutral-900 dark:text-white tabular-nums">
            <Counter value={grand} />
          </span>
        </div>

        {/* Contest summary (right half) */}
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <span className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="h-4 w-4" />
            Total Contests
          </span>
          <span className="text-5xl sm:text-6xl font-display font-extrabold text-neutral-900 dark:text-white tabular-nums">
            <Counter value={totalContests} />
          </span>
          {contestPlatforms.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              {contestPlatforms.map(({ label, color, count }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/60 px-2.5 py-0.5 text-[11px] font-mono text-neutral-600 dark:text-neutral-400 backdrop-blur"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  {label} <span className="tabular-nums">{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform legend (all sources) */}
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {sources.map((s) => (
          <span key={s.platform} className="inline-flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            <span className={`h-2 w-2 rounded-[2px] ${PLATFORM_HEAT[s.platform] || 'bg-indigo-500'}`} />
            {PLATFORM_LABEL[s.platform] || s.platform}
          </span>
        ))}
        <span className="ml-auto tabular-nums text-[10px] font-mono text-neutral-400">last 365 days</span>
      </div>

      {/* Color-coded 365-day heatmap (platform-differentiated). On small screens
          the scroller is RTL so it opens at the RIGHT (recent days first); the
          inner flex restores LTR so the week columns stay in normal order. */}
      {/* Heatmap (left) + LeetCode solved circle (right) */}
      <div className="mt-4 flex flex-col items-center gap-8 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1 overflow-x-auto [direction:rtl] lg:[direction:ltr]">
          <div className="flex [direction:ltr]">
            <div className="mr-2 flex w-5 flex-col pt-3 text-[9px] font-mono text-neutral-400">
              <span className="leading-[14px]">Mon</span>
              <span className="leading-[14px]">Wed</span>
              <span className="leading-[14px]">Fri</span>
            </div>
            <div className="flex flex-col">
              <div className="relative mb-1 h-3">
                {monthLabels.map(({ col, label }) => (
                  <span
                    key={label}
                    className="absolute whitespace-nowrap text-left text-[9px] font-mono text-neutral-400"
                    style={{ left: `calc(${col} * (0.625rem + 0.25rem) - 0.125rem)` }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                {weeks.map((week, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    {week.cells.map((c) => (
                      <div
                        key={c.key}
                        title={c.count ? `${PLATFORM_LABEL[c.count] || c.count} on ${c.key}` : c.key}
                        className={`h-2.5 w-2.5 shrink-0 rounded-[2px] transition-all duration-150 ${
                          c.count
                            ? `${PLATFORM_HEAT[c.count] || 'bg-indigo-500'} hover:bg-indigo-400 hover:shadow-[0_0_8px_2px_rgba(99,102,241,0.6)] hover:scale-125`
                            : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-300/70 hover:shadow-[0_0_6px_1px_rgba(99,102,241,0.4)] hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* LeetCode solved circular graph + hover link icon */}
        {leet && (
          <div className="group/leet relative shrink-0 border-t border-neutral-200/70 pt-6 lg:border-0 lg:border-l lg:border-l-neutral-200/70 lg:pl-8 lg:pt-0 dark:border-neutral-800/70 dark:lg:border-l-neutral-800/70">
            <LeetCodeCircle leet={leet} />
            <a
              href={leet.handle ? `https://leetcode.com/u/${leet.handle}` : SITE.socials.codolio}
              target="_blank"
              rel="noreferrer"
              className="absolute -top-0 right-1 grid h-7 w-7 place-items-center rounded-full border border-neutral-200/80 bg-white/90 text-neutral-600 opacity-0 shadow-sm transition-opacity duration-200 hover:border-indigo-400 hover:text-indigo-500 group-hover/leet:opacity-100 dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-300"
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {/* Streak (LeetCode) + combined active days */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 px-3 py-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <div>
            <div className="text-lg font-display font-bold text-neutral-900 dark:text-white tabular-nums">
              <Counter value={leet?.activity?.maxStreak ?? 0} />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">max streak</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 px-3 py-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          <div>
            <div className="text-lg font-display font-bold text-neutral-900 dark:text-white tabular-nums">
              <Counter value={activeDays.size} />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">total active days</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/** A badge medal; clicking expands to reveal the full award name. */
const ExpandableBadge = ({ badge }) => {
  const [open, setOpen] = useState(false);
  const short = (badge.name || '').replace('Received for ', '').replace(/[.!]+$/, '');
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-neutral-200/70 bg-white/60 px-2.5 py-1.5 text-left transition-colors hover:border-indigo-400/60 dark:border-neutral-800/70 dark:bg-neutral-900/60"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-indigo-200/70 bg-indigo-50/60 ring-1 ring-black/5 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:ring-white/10">
          {badge.icon ? (
            <img src={badge.icon} alt="" className="h-6 w-6 object-contain" />
          ) : (
            <Trophy className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-mono text-neutral-700 dark:text-neutral-300">{short}</span>
          <span className="block text-[9px] font-mono text-indigo-500 dark:text-indigo-400">
            {open ? 'tap to close' : 'tap to view'}
          </span>
        </span>
      </button>
      {open && (
        <p className="mt-1.5 rounded-lg bg-neutral-100/80 px-3 py-2 text-[11px] leading-relaxed text-neutral-600 dark:bg-neutral-900/80 dark:text-neutral-400">
          {badge.name}
        </p>
      )}
    </div>
  );
};

const PlatformCard = ({ p }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="group relative p-6 rounded-2xl glass overflow-hidden hover:border-indigo-500/40 transition-colors"
  >
    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    {/* Hover link icon → platform profile */}
    <a
      href={platformUrl(p)}
      target="_blank"
      rel="noreferrer"
      className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-neutral-200/80 bg-white/90 text-neutral-600 opacity-0 shadow-sm transition-opacity duration-200 hover:border-indigo-400 hover:text-indigo-500 group-hover:opacity-100 dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-300"
    >
      <ArrowUpRight className="h-4 w-4" />
    </a>
    <div className="flex items-center gap-3">
      <PlatformLogo platform={p.platform} photo={p.photo} />
      <div className="min-w-0">
        <div className="font-display font-bold text-base text-neutral-900 dark:text-white">
          {PLATFORM_LABEL[p.platform] || p.platform}
        </div>
        <div className="truncate text-[11px] font-mono text-neutral-400">@{p.handle}</div>
      </div>
      <div className="ml-auto text-right">
        {(p.stars || p.rank) && (
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 capitalize">
            {p.stars ? `${'★'.repeat(p.stars)}${p.stars > 1 ? ` ${p.stars}` : ''}` : p.rank}
          </div>
        )}
      </div>
    </div>
    <div className="mt-4 flex items-baseline gap-2">
      <span className="text-3xl font-display font-bold text-neutral-900 dark:text-white tabular-nums">
        {p.rating != null ? <Counter value={p.rating} /> : '—'}
      </span>
      {p.maxRating ? (
        <span className="text-[11px] font-mono text-neutral-400">max {p.maxRating}</span>
      ) : null}
      {p.total?.total > 0 && (
        <span className="ml-auto text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
          {p.total.total} solved
        </span>
      )}
    </div>
    {p.contests?.length > 0 && (
      <div className="mt-4 space-y-1 border-t border-neutral-200/70 dark:border-neutral-800/70 pt-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Recent Contests</div>
        {p.contests.slice(0, 3).map((c, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            <span className="truncate">{c.name}</span>
            <span className="shrink-0 tabular-nums">
              {c.rating != null ? `${c.rating} · ` : ''}
              {fmtDate(c.date)}
            </span>
          </div>
        ))}
      </div>
    )}
    {/* CodeChef awards — Codolio-style circular medal, click to reveal full name */}
    {p.platform === 'codechef' && (p.badges || []).length > 0 && (
      <div className="mt-4 border-t border-neutral-200/70 dark:border-neutral-800/70 pt-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Awards · tap to view</div>
        <div className="mt-2 flex flex-col gap-2">
          {(p.badges || []).slice(0, 8).map((b, i) => (
            <ExpandableBadge key={i} badge={b} />
          ))}
        </div>
      </div>
    )}
    {/* LeetCode awards — circular real badge images */}
    {p.platform === 'leetcode' && p.handle && (
      <div className="mt-4 border-t border-neutral-200/70 dark:border-neutral-800/70 pt-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Awards</div>
        <div className="mt-2 flex flex-wrap gap-3">
          {[
            { src: 'https://assets.leetcode.com/static_assets/public/images/badges/2024/gif/2024-08.gif', name: 'Daily Challenge', value: p.activity?.maxStreak || 0 },
            { src: 'https://assets.leetcode.com/static_assets/public/images/badges/2024/gif/2024-06.gif', name: 'Contests', value: (p.contests || []).length },
            { src: p.photo, name: 'Profile', value: p.total?.total || 0 },
          ].map((a, i) => (
            <div key={i} className="flex flex-col items-center gap-1" title={`${a.name}: ${a.value}`}>
              <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-indigo-200/70 bg-white ring-1 ring-black/5 dark:border-indigo-500/30 dark:bg-neutral-900 dark:ring-white/10">
                <img src={a.src} alt={a.name} className="h-full w-full object-cover" />
              </span>
              <span className="max-w-[5.5rem] truncate text-center text-[9px] font-mono text-neutral-500 dark:text-neutral-400">
                {a.name} <span className="tabular-nums">{a.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
  </motion.div>
);

/** GitHub card: circular contribution ring at top + simple stats below. */
const GitHubCard = ({ gh, index = 0 }) => {
  if (!gh || !gh.handle) return null;

  const SIZE = 136;
  const STROKE = 8;
  const radius = (SIZE - STROKE) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.round(((gh.totalContributions || 0) / 500) * 100));
  const filled = circ * (1 - pct / 100);

  const stats = [
    { label: 'Repos', value: gh.repos },
    { label: 'Followers', value: gh.followers },
    { label: 'Commits', value: gh.commits },
    { label: 'Stars', value: gh.stars },
    { label: 'Active Days', value: gh.activeDays },
  ].filter((s) => s.value != null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative p-6 rounded-2xl glass overflow-hidden hover:border-indigo-500/40 transition-colors flex flex-col items-center text-center"
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* Hover link icon → GitHub profile */}
      <a
        href={`https://github.com/${gh.handle}`}
        target="_blank"
        rel="noreferrer"
        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-neutral-200/80 bg-white/90 text-neutral-600 opacity-0 shadow-sm transition-opacity duration-200 hover:border-indigo-400 hover:text-indigo-500 group-hover:opacity-100 dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-300"
      >
        <ArrowUpRight className="h-4 w-4" />
      </a>

      <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white">GitHub</h3>
      <a href={SITE.socials.github} target="_blank" rel="noreferrer" className="truncate text-[11px] font-mono text-neutral-400 hover:text-indigo-500 transition-colors">
        @{gh.handle}
      </a>

      {/* Circular contribution ring with avatar centre */}
      <div className="relative mt-4" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden="true">
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={radius}
            fill="none" strokeWidth={STROKE}
            className="stroke-neutral-200 dark:stroke-neutral-800"
          />
          <motion.circle
            cx={SIZE / 2} cy={SIZE / 2} r={radius}
            fill="none" strokeWidth={STROKE} strokeLinecap="round"
            className="stroke-indigo-500 dark:stroke-indigo-400"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            whileInView={{ strokeDashoffset: filled }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        {/* Centre: avatar + % toward the 500-contribution target */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-full bg-white/60 dark:bg-neutral-950/60">
          <span className="grid h-10 w-10 place-items-center rounded-full text-neutral-800 dark:text-neutral-200">
            <Github className="h-6 w-6" />
          </span>
          <span className="mt-1 text-sm font-display font-bold text-neutral-900 dark:text-white tabular-nums">
            {gh.totalContributions != null ? <Counter value={gh.totalContributions} /> : '—'}
          </span>
          <span className="text-[8px] font-mono text-neutral-400">/ 500</span>
        </div>
      </div>

      {/* Contribution arc label */}
      <div className="mt-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
        {gh.totalContributions != null ? `${pct}%` : '—'} of contribution target
      </div>

      {/* Stats below the ring */}
      {stats.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-neutral-200/70 dark:border-neutral-800/70 bg-white/50 dark:bg-neutral-900/50 px-2 py-1.5 text-center">
              <div className="text-base font-display font-bold text-neutral-900 dark:text-white tabular-nums">
                <Counter value={s.value} />
              </div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Contribution target pill */}
      <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/50 dark:bg-neutral-900/50 px-3 py-1.5">
        <Github className="h-4 w-4 text-neutral-400" />
        <span className="font-display font-bold text-neutral-900 dark:text-white tabular-nums">
          <Counter value={pct} />
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">% of 500 target</span>
      </div>

      {/* GitHub awards — circular real images */}
      <div className="mt-4 w-full border-t border-neutral-200/70 dark:border-neutral-800/70 pt-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Awards</div>
        <div className="mt-2 flex flex-wrap gap-3">
          {[
            { src: 'https://github.githubassets.com/images/mona-loading-default.gif', name: 'Contributor' },
            { src: 'https://github.githubassets.com/images/modules/profile/achievements/yolo-default.png', name: 'YOLO' },
          ]
            .filter(Boolean)
            .map((a, i) => (
              <div key={i} className="flex flex-col items-center gap-1" title={a.name}>
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-neutral-200/70 bg-white ring-1 ring-black/5 dark:border-neutral-700 dark:bg-neutral-900 dark:ring-white/10">
                  <img src={a.src} alt={a.name} className="h-full w-full object-cover" />
                </span>
                <span className="max-w-[4.5rem] truncate text-center text-[9px] font-mono text-neutral-500 dark:text-neutral-400">
                  {a.name}
                </span>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
};

export const CodolioStats = ({ data }) => {
  const platforms = data?.platforms?.length ? data.platforms : [];
  if (!platforms.length) return null;

  const leet = platforms.find((p) => p.platform === 'leetcode');
  // All platforms render as regular cards (LeetCode included).
  const allCards = platforms;
  const others = platforms.filter((p) => p.platform !== 'leetcode');
  const github = data?.github || null;

  return (
    <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-200/70 dark:border-neutral-800/70">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 text-center sm:text-left">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Competitive Coding</span>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white mt-1 tracking-tight">
            <AnimatedText text="Live Coding Stats" inView />
          </h2>
        </div>
        <a
          href={SITE.socials.codolio}
          target="_blank"
          rel="noreferrer"
          className="link-underline inline-flex items-center justify-center sm:justify-start gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-indigo-500 transition-colors group"
        >
          <span>View on Codolio</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </a>
      </div>

      {/* Merged card: total solved + contest summary + activity heatmap */}
      <TotalCard platforms={platforms} leet={leet} github={github} others={others} />

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* LeetCode + Codeforces stacked in one column (LeetCode half, CF below) */}
        {leet && (
          <div className="flex flex-col gap-6">
            <PlatformCard p={leet} />
            {(() => {
              const cf = platforms.find((x) => x.platform === 'codeforces');
              return cf ? <PlatformCard p={cf} /> : null;
            })()}
          </div>
        )}
        {github && <GitHubCard gh={github} index={others.length} />}
        {allCards
          .filter((p) => p.platform !== 'leetcode' && p.platform !== 'codeforces')
          .map((p) => (
            <PlatformCard key={p.platform} p={p} />
          ))}
      </div>
    </section>
  );
};

export default CodolioStats;