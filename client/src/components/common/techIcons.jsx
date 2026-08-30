import {
  SiReact,
  SiReactquery,
  SiNextdotjs,
  SiTypescript,
  SiJavascript,
  SiHtml5,
  SiCss,
  SiSass,
  SiTailwindcss,
  SiFramer,
  SiThreedotjs,
  SiChartdotjs,
  SiNodedotjs,
  SiExpress,
  SiNodemon,
  SiSocketdotio,
  SiGraphql,
  SiJsonwebtokens,
  SiOpenapiinitiative,
  SiSwagger,
  SiServerless,
  SiNginx,
  SiStripe,
  SiGithub,
  SiGit,
  SiDocker,
  SiKubernetes,
  SiLinux,
  SiVercel,
  SiNetlify,
  SiCloudflare,
  SiMongodb,
  SiMongoose,
  SiRedis,
  SiPostgresql,
  SiMysql,
  SiSqlite,
  SiFirebase,
  SiSupabase,
  SiPrisma,
  SiCloudinary,
  SiVite,
  SiWebpack,
  SiEslint,
  SiPrettier,
  SiJest,
  SiVitest,
  SiZod,
  SiFigma,
  SiPostman,
  SiMarkdown,
  SiPython,
} from 'react-icons/si';
import {
  Binary,
  Boxes,
  Database,
  Network,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

/**
 * Technology names in the database are compound and human-written ("Git, GitHub &
 * CI/CD Actions", "JavaScript (ESNext) / TypeScript"), so logos are matched by
 * keyword rather than by exact name. Order is significant — the first pattern to
 * match wins, so narrower patterns must come before broader ones that would also
 * match the same string.
 *
 * `mono: true` marks marks drawn in the current text colour instead of their own:
 * brand logos that are black or near-black (and would vanish on the dark theme),
 * plus the lucide stand-ins used for concepts that have no logo at all.
 *
 * Shared by the skills page, project cards, the project detail stack and the
 * resume, so a technology always appears with the same mark everywhere.
 */
const TECH_ICONS = [
  // ---- Frontend -----------------------------------------------------------
  // Before /react/ — "TanStack Query (React Query)" would otherwise match it.
  { match: /tanstack|react[\s-]?query/i, Icon: SiReactquery, color: '#FF4154' },
  { match: /next\.?js/i, Icon: SiNextdotjs, mono: true },
  // Before /javascript/ — "JavaScript (ESNext) / TypeScript" names both.
  { match: /typescript/i, Icon: SiTypescript, color: '#3178C6' },
  { match: /react/i, Icon: SiReact, color: '#61DAFB' },
  { match: /tailwind/i, Icon: SiTailwindcss, color: '#06B6D4' },
  { match: /framer/i, Icon: SiFramer, color: '#0055FF' },
  { match: /three\.?js|webgl|r3f/i, Icon: SiThreedotjs, mono: true },
  { match: /chart\.?js|recharts|d3/i, Icon: SiChartdotjs, color: '#FF6384' },
  { match: /\bsass\b|\bscss\b/i, Icon: SiSass, color: '#CC6699' },
  { match: /html/i, Icon: SiHtml5, color: '#E34F26' },
  { match: /\bcss\b|postcss/i, Icon: SiCss, color: '#663399' },
  // No Simple Icons mark exists for Zustand, Redux Toolkit et al.
  { match: /zustand|redux|jotai|state management/i, Icon: Boxes, mono: true },

  // ---- Backend ------------------------------------------------------------
  { match: /node/i, Icon: SiNodedotjs, color: '#5FA04E' },
  { match: /nodemon/i, Icon: SiNodemon, color: '#76D04B' },
  { match: /express/i, Icon: SiExpress, mono: true },
  { match: /socket\.?io|websocket/i, Icon: SiSocketdotio, mono: true },
  { match: /graphql/i, Icon: SiGraphql, color: '#E10098' },
  { match: /jwt|oauth|\bauth\b/i, Icon: SiJsonwebtokens, mono: true },
  { match: /swagger/i, Icon: SiSwagger, color: '#85EA2D' },
  { match: /rest|openapi/i, Icon: SiOpenapiinitiative, color: '#6BA539' },
  { match: /serverless|microservice/i, Icon: SiServerless, color: '#FD5750' },
  { match: /nginx/i, Icon: SiNginx, color: '#009639' },
  { match: /stripe|payment/i, Icon: SiStripe, color: '#635BFF' },
  { match: /crypto|encryption|security/i, Icon: ShieldCheck, mono: true },
  { match: /distributed|message queue|kafka/i, Icon: Network, mono: true },

  // ---- Data ---------------------------------------------------------------
  { match: /mongoose/i, Icon: SiMongoose, color: '#880000' },
  { match: /mongo/i, Icon: SiMongodb, color: '#47A248' },
  { match: /redis/i, Icon: SiRedis, color: '#FF4438' },
  { match: /postgres/i, Icon: SiPostgresql, color: '#4169E1' },
  { match: /mysql|mariadb/i, Icon: SiMysql, color: '#4479A1' },
  { match: /sqlite/i, Icon: SiSqlite, color: '#003B57' },
  { match: /firebase/i, Icon: SiFirebase, color: '#DD2C00' },
  { match: /supabase/i, Icon: SiSupabase, color: '#3FCF8E' },
  { match: /prisma/i, Icon: SiPrisma, mono: true },
  { match: /cloudinary/i, Icon: SiCloudinary, color: '#3448C5' },
  { match: /indexeddb|database|\bsql\b|data model/i, Icon: Database, mono: true },

  // ---- DevOps & Cloud -----------------------------------------------------
  { match: /github|ci\/cd/i, Icon: SiGithub, mono: true },
  { match: /\bgit\b/i, Icon: SiGit, color: '#F05032' },
  { match: /docker|container/i, Icon: SiDocker, color: '#2496ED' },
  { match: /kubernetes|k8s/i, Icon: SiKubernetes, color: '#326CE5' },
  { match: /linux|ubuntu|bash|terminal/i, Icon: SiLinux, mono: true },
  { match: /netlify/i, Icon: SiNetlify, color: '#00C7B7' },
  { match: /cloudflare/i, Icon: SiCloudflare, color: '#F38020' },
  // Simple Icons dropped the AWS mark, so cloud/deploy skills show Vercel.
  { match: /vercel|render|aws|deploy|cloud/i, Icon: SiVercel, mono: true },

  // ---- Tooling ------------------------------------------------------------
  { match: /vite/i, Icon: SiVite, color: '#646CFF' },
  { match: /webpack/i, Icon: SiWebpack, color: '#8DD6F9' },
  { match: /eslint/i, Icon: SiEslint, color: '#4B32C3' },
  { match: /prettier/i, Icon: SiPrettier, color: '#F7B93E' },
  { match: /vitest/i, Icon: SiVitest, color: '#6E9F18' },
  { match: /jest|testing/i, Icon: SiJest, color: '#C21325' },
  { match: /\bzod\b|validation/i, Icon: SiZod, color: '#3E67B1' },
  { match: /figma/i, Icon: SiFigma, color: '#F24E1E' },
  { match: /postman/i, Icon: SiPostman, color: '#FF6C37' },
  { match: /markdown|mdx/i, Icon: SiMarkdown, mono: true },
  { match: /workflow|agile|scrum/i, Icon: Workflow, mono: true },

  // ---- Languages & fundamentals ------------------------------------------
  { match: /python/i, Icon: SiPython, color: '#3776AB' },
  { match: /javascript|\bes\d|esnext/i, Icon: SiJavascript, color: '#F7DF1E' },
  { match: /algorithm|data structure|complexity/i, Icon: Binary, mono: true },
];

/**
 * Returns `{ Icon, color?, mono? }` for a technology name, or null when nothing
 * matches — callers fall back to a generic icon of their own.
 */
export const resolveTechIcon = (name = '') =>
  TECH_ICONS.find((entry) => entry.match.test(name)) || null;

export default resolveTechIcon;
