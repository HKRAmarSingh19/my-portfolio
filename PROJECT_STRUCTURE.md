# Portfolio — Project Structure

A complete, deep map of the **Full-Stack Minimal Editorial MERN Portfolio**. This document describes every file's role and how the pieces connect. It is the living counterpart to [README.md](./README.md) (quickstart) and [mern-portfolio-plan.md](./mern-portfolio-plan.md) (original specification).

**Stack at a glance:** MongoDB · Express · React 19 (Vite) · Node.js — styled with Tailwind CSS, animated with Framer Motion, delivered as two packages (`client/` + `server/`) from a `concurrently`-driven root.

---

## 1. Repository Layout (top level)

```
Portfolio/
├── .claude/                        # VSCode/Claude Code editor config
├── client/                         # React SPA frontend (Vite)
├── server/                         # Express REST API + MongoDB
├── node_modules/                   # Root deps (concurrently, framer-motion)
├── package.json                    # Root orchestration scripts
├── package-lock.json
├── README.md                       # Quickstart + feature overview
├── mern-portfolio-plan.md          # Original specification / build plan
├── PROJECT_STRUCTURE.md            # THIS file — deep structural map
├── profile_pic.jpeg                # Original source portrait (used at build time?)
└── .gitignore                      # (expected — node_modules, .env, dist)
```

> **Note:** the working tree has `server/open` `client/node_modules` present; they are ignored below for readability. The `client/dist/` folder is the production Vite build output.

---

## 2. Root `package.json` — orchestration

The root package does **no application logic**; it exists to run both apps with one command via `concurrently`.

| Script | Command | Purpose |
|---|---|---|
| `install:all` | installs root + `--prefix server` + `--prefix client` | One-shot setup |
| `install:server` / `install:client` | targeted installs | Per-package setup |
| `dev` | `concurrently` server + client | Full-stack dev, both hot-reload |
| `dev:server` | `npm run dev --prefix server` | Nodemon API on :5000 |
| `dev:client` | `npm run dev --prefix client` | Vite SPA on :5173 |
| `build:client` | production build into `client/dist` | Deploy artifact |
| `seed` | load starter content into MongoDB | First-run data |
| `start` | serve API in production (`node server.js`) | Deploy |

Root deps: `concurrently` (dev) + `framer-motion` (hoisted). All real dependencies live in the per-package manifests.

---

## 3. Frontend — `client/`

```
client/
├── package.json                # React 19 app manifest (see deps below)
├── package-lock.json
├── vite.config.js              # Dev server :5173 + /api & /uploads proxy → :5000
├── tailwind.config.js          # Design tokens (palette, fonts, spacing)
├── postcss.config.js           # Tailwind + autoprefixer pipeline
├── index.html                  # Vite HTML entry (mounts #root, font links)
├── public/
│   ├── favicon.svg             # Site icon
│   └── profile.jpeg            # Portrait served statically
├── dist/                       # Production build output (generated, don't edit)
│   └── assets/                 # Hashed .js/.css bundles
└── src/
    ├── main.jsx                # React entry: providers + router
    ├── App.jsx                 # Route tree + shared layout shell
    ├── index.css               # Global editorial styles + Tailwind directives
    ├── api/
    │   └── client.js           # Axios instance + all API service groups
    ├── context/
    │   ├── ThemeContext.jsx     # Light/dark theme state
    │   └── AuthContext.jsx      # JWT auth state + login/logout
    ├── components/
    │   ├── Intro.jsx            # Animated splash on first Home load
    │   ├── layout/
    │   ├── common/
    │   ├── three/
    │   ├── skills/
    │   └── admin/
    └── pages/
        └── admin/
```

### 3.1 Client dependencies (from `client/package.json`)

- **Core:** `react` 19, `react-dom` 19, `react-router-dom` 7
- **Data:** `@tanstack/react-query` 5 (server-state cache)
- **HTTP:** `axios`
- **Motion/UI:** `framer-motion`, `lucide-react`, `react-icons`, `canvas-confetti`, `clsx`, `tailwind-merge`
- **3D:** `three`, `@react-three/fiber` 9, `@react-three/drei`
- **Markdown:** `react-markdown` 10, `remark-gfm`, `rehype-highlight`
- **Build:** `vite` 6, `@vitejs/plugin-react`, `tailwindcss` 3, `postcss`, `autoprefixer`

### 3.2 `src/main.jsx` — provider stack (top → bottom)

```
<QueryClientProvider>   → TanStack Query (5 min stale, no refetch-on-focus)
  <BrowserRouter>       → routing
    <ThemeProvider>     → theme context
      <AuthProvider>    → auth context
        <App/>
```

### 3.3 `src/App.jsx` — routing & layout

- **Shared chrome** (non-admin routes): `AmbientBackground`, `ScrollProgress`, `Navbar`, `CommandPalette`, `Footer`, plus the `Intro` splash on `/`.
- **Page transitions** via `AnimatePresence mode="wait"` keyed on `location.pathname`.
- **Public routes:** `/`, `/about`, `/projects`, `/projects/:slug`, `/skills`, `/gallery`, `/blog`, `/blog/:slug`, `/resume`, `/contact`, `*` → NotFound.
- **Admin routes:** `/admin/login` (standalone) and `/admin` which wraps the rest in `AdminLayout`:
  - index → `Dashboard`, `profile`, `projects`, `blog`, `skills`, `experience`, `gallery`, `messages`.

| Route | File | Responsible for |
|---|---|---|
| `/` | [pages/Home.jsx](client/src/pages/Home.jsx) | Hero, featured intro, profile portrait, CTA |
| `/about` | [pages/About.jsx](client/src/pages/About.jsx) | Bio, timeline/approach |
| `/projects` | [pages/Projects.jsx](client/src/pages/Projects.jsx) | Filterable/searchable card grid |
| `/projects/:slug` | [pages/ProjectDetail.jsx](client/src/pages/ProjectDetail.jsx) | Markdown-supported case study |
| `/skills` | [pages/Skills.jsx](client/src/pages/Skills.jsx) | Category-grouped proficiency directory |
| `/gallery` | [pages/Gallery.jsx](client/src/pages/Gallery.jsx) | Filterable image grid — caption above each photo; photo click opens a **fullscreen ImageViewer overlay** (not navigation); multi-image cards get hover prev/next arrows + fullscreen icon |
| `/gallery/:id` | [pages/GalleryItemDetail.jsx](client/src/pages/GalleryItemDetail.jsx) | Single-photo page (for any item: one image or a whole collection) — shared ImageViewer + thumbnail strip + meta |
| `/blog` | [pages/Blog.jsx](client/src/pages/Blog.jsx) | Post list: pills, reading time, views |
| `/blog/:slug` | [pages/BlogPost.jsx](client/src/pages/BlogPost.jsx) | Markdown article + syntax highlight |
| `/resume` | [pages/Resume.jsx](client/src/pages/Resume.jsx) | Structured resume + print-to-PDF |
| `/contact` | [pages/Contact.jsx](client/src/pages/Contact.jsx) | Validated form + confetti + toasts |
| `*` | [pages/NotFound.jsx](client/src/pages/NotFound.jsx) | 404 |

### 3.4 API layer — `src/api/client.js`

Single Axios instance (`baseURL: '/api'`). **Request interceptor** injects `Authorization: Bearer <token>` from `localStorage['portfolio_token']`. **Response interceptor** redirects to `/admin/login` on 401 for admin pages. Exported service groups mirror the REST endpoints:

| Service | Methods → Endpoints |
|---|---|
| `authApi` | `login` POST `/auth/login`, `getMe` GET `/auth/me`, `updateDetails` PUT `/auth/update-details` |
| `projectsApi` | `getAll`, `getBySlug`, `create`, `update`, `delete` |
| `blogApi` | `getAll`, `getBySlug`, `create`, `update`, `delete` |
| `skillsApi` | `getAll`, `create`, `update`, `delete` |
| `experienceApi` | `getAll`, `create`, `update`, `delete` |
| `messagesApi` | `send` POST `/contact/submit`, `getAll`, `toggleRead` PATCH `/messages/:id/read`, `toggleStar` PATCH, `delete` |
| `statsApi` | `getStats` GET `/stats` (analytics counters) |
| `profileApi` | `get` GET `/profile`; `update` PUT `/auth/update-details` |
| `uploadApi` | `uploadImage` POST `/upload` (multipart) |
| `galleryApi` | `getAll`, `get`, `create`, `update`, `delete` (carries optional `music`) |
| `musicApi` | `search` GET `/music/search?q=` (iTunes proxy) |
| `savedMusicApi` | `getAll` GET `/saved-music`, `save` POST, `remove` DELETE `/:id` |

### 3.5 Components by folder

```
components/
├── Intro.jsx                 # Splash overlay on first visit to /
├── layout/
│   ├── Navbar.jsx            # Primary nav + command-palette trigger
│   ├── Footer.jsx            # Site footer
│   └── PageTransition.jsx    # Motion page-change wrapper
├── common/                   # Reusable UI primitives
│   ├── AmbientBackground.jsx # Subtle animated page backdrop
│   ├── AnimatedText.jsx      # Scroll-triggered text reveal
│   ├── CommandPalette.jsx    # ⌘K / Ctrl+K fuzzy navigation + theme switch
│   ├── Counter.jsx           # Animated number / stat counter
│   ├── MagneticButton.jsx    # Cursor-magnetic CTA
│   ├── ImageCropModal.jsx    # Admin zoom/crop at pick time (react-easy-crop; exports cropped file)
│   ├── ImageViewer.jsx       # Shared Google-Maps image viewer: wheel-zoom + drag-pan + on-image controls + autoplay
│   ├── Marquee.jsx           # Scrolling text/ticker
│   ├── MusicPlayer.jsx       # Pill (card) & bar (detail page) audio player
│   ├── PageHeader.jsx        # Standardized page hero heading
│   ├── ProfilePortrait.jsx   # Portrait with interaction
│   ├── SEO.jsx               # Meta/OG tags per page
│   ├── ScrollProgress.jsx    # Top scroll progress bar
│   ├── Spotlight.jsx         # Cursor spotlight effect
│   ├── TechBadge.jsx         # Pill for a single tech
│   ├── TiltCard.jsx          # 3D-tilt hover card
│   └── techIcons.jsx          # Icon map for tech names
├── three/                    # React-Three-Fiber scenes
│   ├── HeroScene.jsx         # Hero WebGL scene
│   └── Scene3D.jsx           # Generic 3D scene wrapper
├── skills/
│   ├── ProficiencyRing.jsx   # Radial proficiency visual
│   ├── SkillCard.jsx         # Card with proficiency + years
│   └── TechMarquee.jsx       # Scrolling tech strip
└── admin/
    ├── AdminLayout.jsx       # Shell for all /admin sub-pages (nav/guard)
    └── MarkdownEditor.jsx    # WYSIWYG-ish editor for blog content
```

### 3.6 Pages — admin

```
pages/admin/
├── Login.jsx             # JWT sign-in (finds admin)
├── Dashboard.jsx         # Overview: counts, recent messages, quick actions
├── Profile.jsx           # Edit own details/avatar
├── ManageProjects.jsx    # CRUD projects
├── ManageBlog.jsx        # CRUD posts via MarkdownEditor
├── ManageSkills.jsx      # CRUD/reorder skills
├── ManageExperiences.jsx # CRUD resume entries
├── ManageGallery.jsx     # CRUD gallery images + music search/pick
└── Messages.jsx          # Inbox: read/star/reply/delete
```

> The Music player is powered by a shared single-`<audio>` context so only one
> track plays app-wide (Instagram-style). See [context/MusicContext.jsx](client/src/context/MusicContext.jsx)
> and [components/common/MusicPlayer.jsx](client/src/components/common/MusicPlayer.jsx).

### 3.7 Config files

- **`client/vite.config.js`** — plugin-react; dev server on `:5173`; proxies `/api` and `/uploads` to `http://localhost:5000`.
- **`client/tailwind.config.js`** — design tokens (monochrome palette, editorial serif + sans typography, spacing scale). Enforces the restrained, consistent aesthetic.
- **`client/postcss.config.js`** — Tailwind + autoprefixer.

---

## 4. Backend — `server/`

```
server/
├── package.json                 # Express API manifest ("type": "module")
├── package-lock.json
├── server.js                    # App entry: middleware chain + route mounting
├── .env                         # Live secrets (git-ignored)
├── .env.example                 # Template for env vars
├── config/
│   └── db.js                    # Mongoose → MongoDB connection
├── models/                      # Mongoose schemas
│   ├── Project.js
│   ├── BlogPost.js
│   ├── Skill.js
│   ├── Experience.js
│   ├── Message.js
│   ├── GalleryItem.js           # gallery image + nested `music` subdocument
│   ├── SavedMusic.js            # bookmarked tracks for quick reuse
│   └── User.js
├── controllers/                 # Route handlers (thin, db-facing)
│   ├── authController.js        # login, getMe, updateDetails
│   ├── projectController.js
│   ├── blogController.js
│   ├── skillController.js
│   ├── experienceController.js
│   ├── messageController.js
│   ├── galleryController.js     # CRUD gallery items (category/featured/search)
│   ├── musicController.js       # searchMusic — iTunes Search API proxy
│   ├── savedMusicController.js  # saved-music library (upsert by previewUrl)
│   ├── profileController.js
│   ├── statsController.js
│   └── uploadController.js      # (via routes/uploadRoutes — file handling)
├── middleware/
│   ├── auth.js                  # JWT verify → attaches user, guards admin
│   ├── validate.js              # Zod request validation factory
│   ├── errorHandler.js          # notFound + centralized error responses
│   └── upload.js                # Multer disk storage + file filter
├── routes/                      # One router per resource
│   ├── authRoutes.js
│   ├── projectRoutes.js
│   ├── blogRoutes.js
│   ├── skillRoutes.js
│   ├── experienceRoutes.js
│   ├── messageRoutes.js
│   ├── galleryRoutes.js         # /:id GET/PUT/DELETE + / GET/POST (mutations protected)
│   ├── musicRoutes.js           # /search — public iTunes search proxy
│   ├── savedMusicRoutes.js      # saved-music CRUD (protected)
│   ├── profileRoutes.js
│   ├── statsRoutes.js
│   └── uploadRoutes.js
├── utils/
│   └── seed.js                 # starter-content seeder (incl. sample gallery items)
└── uploads/                    # Multer write target (served at /uploads)
    └── image-*.{png,jpeg}      # Uploaded assets
```

### 4.1 Server dependencies

`express` 4, `mongoose` 8, `cors`, `helmet` 8, `morgan`, `dotenv`, `express-rate-limit`, `jsonwebtoken`, `bcryptjs`, `multer`, `slugify`, `zod`. Dev: `nodemon`.

### 4.2 `server.js` — middleware chain & API surface

```
helmet (cross-origin resource policy) → cors (allowlist localhost/CLIENT_URL)
  → express.json / urlencoded (10mb)
  → morgan (dev only)
  → /uploads static serve
GET /api/health                                → { status: 'online', timestamp, env }
/api/auth        → authRoutes
/api/projects    → projectRoutes
/api/blog        → blogRoutes
/api/skills      → skillRoutes
/api/messages    → messageRoutes
/api/contact     → contactLimiter (10 req / 15 min) + messageRoutes
/api/experience  → experienceRoutes
/api/gallery     → galleryRoutes
/api/music       → musicRoutes    (GET /search → iTunes proxy)
/api/saved-music → savedMusicRoutes (protected CRUD)
/api/stats       → statsRoutes
/api/upload      → uploadRoutes
/api/profile     → profileRoutes
→ notFound → errorHandler (JSON error contract)
```

The **contact endpoint** has a dedicated rate limit (`contactLimiter`, 10 requests / 15-min window per IP) layered above the message handlers.

### 4.3 Data models (Mongoose)

| Model | Notable fields |
|---|---|
| `Project` | `title`, `slug` (auto via slugify, unique), `description`, `longDescription`, `category`, `techStack[]`, `images[]`, `liveUrl`, `repoUrl`, `featured`, `order`, timestamps |
| `BlogPost` | `title`, `slug` (auto, unique), `excerpt`, `content` (Markdown), `coverImage`, `tags[]`, `published`, `publishedAt`, view tracking |
| `Skill` | `name`, `category` (`Frontend / Backend / Database / DevOps & Cloud / Languages / Tools & Workflow`), `proficiency` (1–100), `yearsOfExperience`, `icon`, `featured`, `order` |
| `Experience` | `type` (`work/education/certification/award`), `title`, `organization`, `location`, `startDate`, `endDate` |
| `GalleryItem` | `title`, `image` (main/first), `images[]` (full ordered list), `category`, `description`, `featured`, `order` + nested `music` subdocument |
| `GalleryItem.music` | `title`, `artist`, `previewUrl` (30s audio), `artworkUrl` (album art), `linkUrl` (Apple Music), `start`/`end` (clip window in seconds), `duration` (full track length in seconds) |
| `SavedMusic` | `title`, `artist`, `previewUrl`, `artworkUrl`, `linkUrl`, `duration` — bookmarked tracks, upserted by `previewUrl` |
| `Message` | `name`, `email`, `subject`, `message`, `read`, `starred` |
| `User` | `name`, `email` (unique), `password` (bcrypt, `select:false`), `role` (`admin`), `avatar` + JWT signing methods |

### 4.4 Middleware

- **`auth.js`** — verifies the JWT from `Authorization: Bearer`, loads the user, guards protected/admin routes.
- **`validate.js`** — `validate(schema)` factory; runs a Zod schema against `body`/`query`/`params`; returns a normalized 400 error array (`field` + `message`).
- **`errorHandler.js`** — exports `notFound` (404 JSON) and `errorHandler` (centralized, stack-aware JSON errors).
- **`upload.js`** — Multer disk storage writing to `server/uploads` (resolved from the server package, not CWD), unique timestamp+random filenames, extension `fileFilter`, capped size.

### 4.5 Full REST surface

```
GET    /api/health
POST   /api/auth/login                      (public)
GET    /api/auth/me                         (auth)
PUT    /api/auth/update-details             (auth)

GET    /api/projects | /api/projects/:slug  (public)
POST/PUT/DELETE /api/projects[...]          (auth)

GET    /api/blog | /api/blog/:slug          (public)
POST/PUT/DELETE /api/blog[...]              (auth)

GET    /api/skills                          (public)
POST/PUT/DELETE /api/skills[...]            (auth)

GET    /api/experience                      (public)
POST/PUT/DELETE /api/experience[...]        (auth)

GET    /api/gallery[/:id]                   (public; ?category, ?featured, ?search)
POST/PUT/DELETE /api/gallery[...]           (auth)
GET    /api/music/search?q=                 (public, iTunes proxy)
GET    /api/saved-music                     (auth)
POST   /api/saved-music                     (auth, upsert by previewUrl)
DELETE /api/saved-music/:id                 (auth)

POST   /api/contact/submit                  (public, rate-limited)
GET    /api/messages                        (auth)
PATCH  /api/messages/:id/read               (auth)
PATCH  /api/messages/:id/star               (auth)
DELETE /api/messages/:id                    (auth)

GET    /api/stats                           (dashboard counters)
GET    /api/profile                         (public hero data)
POST   /api/upload                          (auth, multipart, single)
POST   /api/upload/multiple                 (auth, multipart, array of up to 10)
```

### 4.6 Environment variables (`server/.env` / `.env.example`)

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/mern_portfolio
JWT_SECRET=...
JWT_EXPIRE=30d
ADMIN_EMAIL=admin@portfolio.local
ADMIN_PASSWORD=AdminPass123!
CLIENT_URL=http://localhost:5173
```

---

## 5. Editor / tooling config — `.claude/`

```
.claude/
├── launch.json               # VSCode run configurations
└── settings.local.json       # Per-project Claude Code settings
```

**`launch.json`** defines three configurations:
- `portfolio-fullstack` — `npm run dev` (both apps), port 5173
- `portfolio-client` — Vite client only
- `portfolio-attach` — attach devtools to `http://localhost:5173`

---

## 6. Data flow (how a request moves through the app)

```
[Browser] → Vite :5173
   │  /api/*  (proxied by vite.config.js)
   ▼
[Express] server.js :5000
   ├─ helmet, cors, morgan, rate-limit
   ├─ /api/<resource>  → routes/<resource>Routes.js
   │     └─ auth middleware (if protected)
   │     └─ validate(schema) (Zod)
   │     └─ <resource>Controller.js
   │           └─ Mongoose model CRUD
   │                 └─ MongoDB
   └─ errorHandler → JSON error (400/401/404/500)
        ▲
[Client] api/client.js → React Query cache → components → UI
```

**Image upload path:** `multipart` → `/api/upload` → Multer writes to `server/uploads/` → served statically at `/uploads/<file>` → URL stored on the document (no binary blobs in MongoDB).

**Music attach path:** admin search (`/api/music/search?q=`) → `musicController.searchMusic` proxied to the iTunes Search API → curated `{ title, artist, previewUrl, artworkUrl, linkUrl, duration }` results → one picked track stored in the `GalleryItem.music` subdocument (`duration` holds the full track length in seconds alongside `start`/`end`). Playback uses a **single shared `<audio>`** (see `MusicContext`) so only one track plays app-wide; iTunes returns a 30-second preview URL. The admin picks a clip window with an Instagram-story style **full-length, two-handle timeline**: the rail spans the whole track (`duration`), and two draggable handles set the **start and end** independently (both ends editable), with the window **capped at 30s**. Dragging stays silent (no scrubbing artifacts) and playback starts from the clip start immediately on release; the clip can be played live while adjusting so the admin hears where the lyrics begin. The saved clip plays from `start` to `end`; `MusicContext` seeks to `start` after metadata loads and auto-pauses at `end`. Tracks can also be **bookmarked** via `savedMusicApi` into a persistent `SavedMusic` library (which also stores `duration`), so any upload can pick a saved track without re-searching.

**Multi-image attach path:** admin selects several files at once → `POST /api/upload/multiple` (multer `upload.array('images', 10)`) returns ordered URLs → stored as `images[]` with `image` kept as the main (first) URL. In the admin form, a unified preview shows the **first image as the large main/cover** (with a "Main" badge) plus a thumbnail strip for the rest; each image can be **removed (X)** or **reordered with arrows** to choose which becomes the cover, working for both newly picked files and already-saved images when editing. **Newly-picked images** also get a **zoom & crop** button (crop icon, top-left) that opens `ImageCropModal` (react-easy-crop): the admin zooms/pans the image behind a **fixed crop frame** and exports exactly that framed area as a JPEG file **replacing the pick in the upload list** (framed version is what gets uploaded on save). The crop frame is **1:1 for the main cover** (matches the square gallery grid) and **3:4 for the other photos** — react-easy-crop only supports a fixed box, so there is no asymmetric/free box resizing. On save, new picks are uploaded and interleaved in place preserving order. The public grid shows the main image with a `+N` badge. **Every gallery item — single image or a whole collection — opens on its own routed page** (`/gallery/:id`, see `GalleryItemDetail`): the page fetches the item via `galleryApi.getById` and shows the title/meta/description, the shared photo viewer, a thumbnail strip to jump between photos (collections), and the music bar. **The grid's photo click opens a **fullscreen overlay** (the same `ImageViewer`) instead of navigating** — the grid routes directly to the detail page. The detail page uses the shared **`ImageViewer`** component, which is a **photo viewer** (Google-Maps style): the **previous/next arrows sit directly on the image** at 50% opacity (they step within the item's own photo set via the parent's index state; clickable only at 1× zoom — zoomed, they pass clicks through so wheel-zoom/drag stay fluid), with a per-set counter badge at 1× and a **download** button overlaid on the image (fetch-as-blob, falls back to opening). It autoplays the item's music on open (shared single `<audio>` via `MusicContext`, `stop()` on unmount) and zooms by **transform** (`translate(pan) scale(zoom)` on the `<img>`, not an overflow box), so when zoomed the image **spills across the full screen** instead of staying clipped in a box. **Mouse does everything**: scroll-wheel zooms (0.1 steps up to 3×) **anchored to the cursor** so the point under it stays fixed, and drag pans (at 3× the cursor speed for a fast feel) — no zoom buttons or slider. A CSS transform transition (300 ms ease-out, disabled while dragging so panning stays 1:1 with the cursor) makes the zoom glide **smoothly "like water"**.

---

## 7. Quick reference — file roles

| Concern | File(s) |
|---|---|
| Full-stack orchestration | [package.json](package.json) |
| App entry (client) | [client/src/main.jsx](client/src/main.jsx), [client/src/App.jsx](client/src/App.jsx) |
| API client | [client/src/api/client.js](client/src/api/client.js) |
| Server entry | [server/server.js](server/server.js) |
| DB connection | [server/config/db.js](server/config/db.js) |

---

*Maintainer note: keep this file in sync whenever the structure or architecture changes. Files under `node_modules/` and `client/dist/` are build artifacts and intentionally omitted.*
