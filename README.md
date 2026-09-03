# Full-Stack Minimal Editorial MERN Portfolio

A modern, high-performance, minimal editorial portfolio application built on **MongoDB, Express.js, React 19 (Vite), and Node.js**, styled with **Tailwind CSS** and animated with **Framer Motion**. It ships with a complete public-facing site and a protected admin dashboard for managing everything from one place.

---

## 🌟 Key Features

### Public Site
- **Minimal Editorial Aesthetic** — refined typography pairings, restrained palette with light/dark mode toggle, generous whitespace, and subtle Framer Motion micro-interactions.
- **Interactive Command Palette** — press `⌘K` / `Ctrl+K` for instant keyboard navigation, theme switching, and quick actions.
- **Project Showcase** — tag/category filtering, real-time search, responsive card grids, and dedicated markdown-supported case study pages.
- **Categorized Skills Directory** — visual proficiency bars and years of experience across Frontend, Backend, Cloud/DevOps, Database, and Tooling.
- **Technical Blog** — markdown-rendered articles with syntax highlighting, topic pills, reading-time estimates, and view tracking.
- **Structured Interactive Resume** — built from a dynamic database schema, with a print-to-PDF stylesheet optimization.
- **Media Gallery** — multi-image photo collections and video uploads, each opening in its own routed page:
  - Google-Maps style viewer: **wheel-zoom anchored to the cursor**, **drag-to-pan**, and on-image **prev/next arrows** + a per-set counter.
  - **Browser fullscreen** entered straight from the viewer with a centered image and working on-image controls.
  - **Adaptive HLS streaming** for videos — uploads are transcoded with **AWS Elemental MediaConvert** into a multi-bitrate HLS ABR ladder and played with **hls.js**, which auto-switches quality to match the visitor's connection (plus a prefetch-ahead buffer for scrubbing).
  - **Video playback** with its own audio — autoplay muted, on-screen Play/Pause and Mute/Unmute, click-the-video-to-toggle, and auto-hiding controls.
  - WhatsApp-style **collage tiles** for multi-photo cards and a thumbnail strip for jumping between shots.
  - Download button for the active media.
- **Social Feeds** — your live Instagram and LinkedIn content, organized as tabs inside the Gallery:
  - **Instagram feed** — an official Meta Graph API sync that mirrors your Instagram media as a grid tab (admin-managed).
  - **LinkedIn feed** — a curated tab, driven by pasting post URLs in the admin panel. Each link is **auto-enriched** by fetching the post's OpenGraph tags, so a card shows the real photo, headline and caption — no manual typing, no API approval needed (LinkedIn's `r_member_social` scope is restricted and RSS/scraping are bot-blocked; per-post enrichment is the reliable path).
- **Contact & Inquiries** — form with input validation, toast notifications, confetti animations, rate-limiting, and direct database storage.

### Admin Dashboard (`/admin`)
- **Full CRUD** for Projects, Markdown Blog Posts, Skills, Resume Experience, and Profile.
- **Gallery Manager** — upload, tag, and caption photos/videos with **zoom & crop at pick time** (main cover framed 1:1, supporting shots 3:4), inline reordering, starring/featured flags, and per-item delete.
- **Social Feed Managers** — sync your Instagram account and add/enrich/remove LinkedIn posts. Both feeds are opt-in: without credentials they simply stay empty and the rest of the site is untouched.
- **Interactive Inbox** — view, star, and reply to client messages.
- **Analytics counters** and quick actions.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, React Router v7, TanStack Query, Framer Motion, React Three Fiber, Lucide Icons |
| **Styling** | Tailwind CSS, PostCSS |
| **Markdown** | React-Markdown, Remark-GFM, Rehype-Highlight |
| **Video** | hls.js (adaptive ABR playback), AWS Elemental MediaConvert (HLS transcoding from S3) |
| **Backend** | Node.js, Express.js (ES Modules), Helmet, Morgan, Express-Rate-Limit, Multer (memory), AWS SDK (S3), fast-xml-parser |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt password hashing, Google OAuth (PKCE) |
| **Validation** | Zod schema validation middleware |
| **Social APIs** | Meta Instagram Graph API, LinkedIn OpenGraph page enrichment |

---

## 🚀 Quick Start

> **Prerequisites:** [Node.js 18+](https://nodejs.org/) and a running [MongoDB](https://www.mongodb.com/) instance (local or Atlas).

### 1. Install Dependencies
From the root directory, this installs root, server, and client dependencies:
```bash
npm run install:all
```

### 2. Environment Variables
Configure `server/.env` (a pre-filled `.env.example` is committed as a template). `JWT_SECRET` is **required** — the server refuses to start without a strong value (≥16 chars):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/mern_portfolio   # or a MongoDB Atlas connection string for permanent/cloud storage
JWT_SECRET=<your-own-strong-random-secret>
JWT_EXPIRE=24h
# Password login is disabled — email/password are only used to seed the initial user record
CLIENT_URL=http://localhost:5173
```

For Google sign-in, add to `server/.env` (see [Google OAuth setup](#-google-oauth-setup-optional)):
```env
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:5173
ALLOWED_ADMIN_EMAILS=<you@gmail.com>,<coadmin@gmail.com>   # the ONLY accounts allowed to sign in (comma-separated)
```
And set the matching public id in `client/.env`:
```env
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

### 3. Seed the Database
Populate starter projects, blog posts, skills, resume experiences, gallery items, and admin credentials:
```bash
npm run seed
```

> **Note:** Password login is **disabled** — the dashboard is accessible **only** via Google OAuth with your allowed account. The seeded `ADMIN_EMAIL`/`ADMIN_PASSWORD` are used only to create the initial user record and are not a usable login.

### 4. Start the Development Servers
Runs the backend API (`localhost:5000`) and the Vite frontend (`localhost:5173`) concurrently:
```bash
npm run dev
```

---

## 📜 Useful Scripts

From the root `package.json`:

| Command | Description |
|---|---|
| `npm run dev` | Start both server and client in watch mode |
| `npm run dev:server` | Start only the Express API |
| `npm run dev:client` | Start only the Vite client |
| `npm run build:client` | Production-build the client |
| `npm run seed` | Seed the database with starter content |
| `npm start` | Run the production server (serves the built client) |

---

## 🔐 Google OAuth Setup (optional)

The recommended way to sign into the admin dashboard is **"Continue with Google"** — only your own verified Google account is allowed. It requires a Google Cloud OAuth client:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials** → **Create Credentials → OAuth client ID** (type **Web application**).
2. Under **Authorized JavaScript origins** add your SPA origin (e.g. `http://localhost:5173`).
3. Under **Authorized redirect URIs** add the **same** origin (e.g. `http://localhost:5173`).
4. Copy the **Client ID** and **Client Secret**.

Then configure the variables shown in [Step 2](#2-environment-variables):
- **Server** (`server/.env`): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `ALLOWED_ADMIN_EMAILS` — a comma-separated list of **your own** verified Google email(s). This is the hard allowlist: any other Google account is rejected with `403`, no matter what.
- **Client** (`client/.env`): `VITE_GOOGLE_CLIENT_ID` (the public id — it and the server's `GOOGLE_CLIENT_ID` are the same value).

> The OAuth **secret never leaves the server** — the browser sends only an authorization code, which the server exchanges with Google (Authorization Code flow with PKCE). **Google is the only sign-in method**: the password login form and route are removed, so only your allowed Google account can access the dashboard. Admin sessions use a short-lived JWT (`JWT_EXPIRE`, default 24h); **logging out "everywhere" is a real server-side revoke** — the token version is bumped so previously-issued tokens are rejected, even if leaked. OAuth must be fully configured (server + `VITE_GOOGLE_CLIENT_ID`) before the dashboard is reachable; without it, the sign-in button is disabled rather than offering a password fallback.

---

## ☁️ AWS S3 Media Storage

Photos & videos are stored in an **AWS S3 bucket** (public-read) instead of the server's local disk — this is required for serverless/ephemeral hosts like Render that reset their filesystem on deploy. Multer holds uploads in memory and streams them to S3; the DB stores the **absolute S3 URL** (`https://<bucket>.s3.<region>.amazonaws.com/<key>`), which the client renders directly.

Setup (one-time, in the [AWS Console](https://console.aws.amazon.com)):
1. Create an **S3 bucket** and apply a **public-read bucket policy** so gallery visitors can load the media.
2. Create an **IAM user** with `AmazonS3FullAccess` and generate an **Access Key**.
3. Add to `server/.env`:
   ```env
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=<your-region>
   AWS_BUCKET=<your-bucket-name>
   ```
   The public URL for each key follows the standard `https://<bucket>.s3.<region>.amazonaws.com/<key>` format.

No client changes are needed — every media consumer already renders absolute URLs verbatim.

---

## 🎬 AWS MediaConvert Adaptive HLS Streaming

Videos are transcoded into a **multi-bitrate HLS ABR ladder** and streamed with **hls.js**, which adapts quality to the visitor's bandwidth and buffers ahead for smooth scrubbing. The pipeline is fully server-side:

1. A video is uploaded to S3.
2. The server submits a one-time **MediaConvert job** using the shared `PortfolioHlsAbr` job template (multi-resolution/bitrate ABR output group + HLS master playlist).
3. On success, the server stores the master `.m3u8` URL on the gallery item, and the client plays it through **hls.js** (falling back to direct `src` where HLS is unsupported).

Setup (one-time, in the [AWS Console](https://console.aws.amazon.com)):
1. Create an IAM role MediaConvert can assume to read S3 input and write S3 output, e.g. `MediaConvertForPortfolio`.
2. Register the job template — either via the Console, or programmatically with the included helper: `node server/scripts/create-mc-template.mjs` (creates `PortfolioHlsAbr`).
3. Add to `server/.env`:
   ```env
   AWS_MEDIACONVERT_ROLE_ARN=arn:aws:iam::<account-id>:role/MediaConvertForPortfolio
   AWS_MEDIACONVERT_JOB_TEMPLATE=PortfolioHlsAbr
   ```

---

## 🌐 Social Feeds (Instagram & LinkedIn)

Both feeds live as **tabs inside the Gallery page** (`/gallery`) and are **opt-in** — without credentials they stay empty and the rest of the site is untouched.

### Instagram
Syncs your media via the official Meta Instagram Graph API (the account must be a **professional** Business/Creator profile). In `server/.env`:
```env
INSTAGRAM_ACCESS_TOKEN=<your-long-lived-access-token>   # 60-day, refreshable
INSTAGRAM_USER_ID=<your-instagram-user-id>
INSTAGRAM_GRAPH_API_VERSION=v22.0
```
Then trigger **Sync Now** from `/admin/instagram`. Each sync mirrors your posts (cursor-paginated, idempotent upserts).

### LinkedIn
A **curated** feed: from `/admin/linkedin` you paste a post URL (optionally with a caption) and it is added as a text-forward card. Each link is **auto-enriched** by fetching the post's OpenGraph tags, so the card shows the post's **photo, headline and caption** automatically — no manual typing. No API approval or permanent token is needed:
```env
LINKEDIN_VANITY_NAME=...          # optional — your public handle for the "View profile" link
```
Why curated: LinkedIn's `r_member_social` scope (needed to fetch your own posts) is restricted and routinely denied to individuals, and public RSS/scraping are bot-blocked — per-post OpenGraph enrichment is the reliable path.

---

## 📂 Project Architecture

```
Portfolio/
├── package.json                 # Root scripts (install, dev, build, seed)
├── README.md
│
├── server/                      # Express REST API
│   ├── config/db.js             # MongoDB (Atlas) connection
│   ├── config/s3.js             # AWS S3 client + uploadToS3 (media storage)
│   ├── config/mediaconvert.js   # AWS MediaConvert client + HLS ABR job submission
│   ├── config/instagram.js      # Meta Instagram Graph API sync (cursor pagination)
│   ├── config/linkedin.js       # LinkedIn feed: curated posts + og:tag enrichment
│   ├── models/                  # User, Project, BlogPost, Skill, Experience,
│   │                            #   Message, GalleryItem, InstagramPost,
│   │                            #   InstagramSettings, LinkedInPost, LinkedInSettings
│   ├── controllers/             # Express route handlers
│   ├── middleware/              # Auth (JWT), Zod validation, error handler, Multer upload (memory)
│   ├── routes/                  # /api/* (auth, projects, blog, skills,
│   │                            #   experience, messages, gallery, uploads, stats,
│   │                            #   profile, instagram, linkedin)
│   ├── scripts/create-mc-template.mjs  # Creates the PortfolioHlsAbr MediaConvert template
│   ├── uploads/                 # Legacy local media (pre-S3 backup; git-ignored)
│   ├── utils/seed.js            # Sample database seeder
│   ├── server.js                # Express app entry
│   └── package.json
│
└── client/                      # React (Vite) frontend
    ├── src/
    │   ├── api/client.js        # Axios client & API services (incl. instagram/linkedIn APIs)
    │   ├── context/             # AuthContext, ThemeContext
    │   ├── components/          # Navbar, Footer, CommandPalette, MarkdownEditor,
    │   │   │                    #   layout, three (3D), common (ImageViewer, SEO, ...),
    │   │   ├── instagram/       # InstagramFeed (Gallery tab grid)
    │   │   ├── linkedin/        # LinkedInFeed (Gallery tab, text-forward cards)
    │   │   └── common/          # ImageViewer (zoom/pan viewer), ImageCropModal,
    │   │                        #   CommandPalette, SEO, AnimatedText, ...
    │   ├── pages/               # Home, About, Projects, Blog, Skills, Resume, Contact,
    │   │   │                    #   Gallery, GalleryItemDetail, BlogPost, ProjectDetail
    │   │   └── admin/           # Login, Dashboard, ManageGallery, ManageProjects,
    │   │                        #   ManageBlog, ManageSkills, ManageExperiences,
    │   │                        #   ManageInstagram, ManageLinkedIn, Messages, Profile
    │   ├── styles/index.css     # Editorial styles & print rules
    │   ├── App.jsx              # Main routing tree
    │   └── main.jsx             # React entry point
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🔐 API Overview

All endpoints are JSON and mounted under `/api` on the Express server. The main public resource groups:

| Resource | Routes | Purpose |
|---|---|---|
| `/api/auth` | `POST /login`, `POST /logout`, `GET /me` | Admin authentication (JWT) |
| `/api/projects` | GET, GET /:id | Project case studies |
| `/api/blog` | GET, GET /:id, `POST /:id/view` | Markdown articles + view tracking |
| `/api/skills` | GET | Skills directory |
| `/api/experience` | GET | Resume timeline |
| `/api/gallery` | GET, GET /:id | Gallery items (photos + video) |
| `/api/messages` | POST (public) / admin CRUD | Contact inquiries + inbox |
| `/api/upload` | POST `multipart/form-data` | Image/video upload → AWS S3 (Multer memory + S3) |
| `/api/stats` | GET | Dashboard analytics |
| `/api/profile` | GET | Portfolio profile/settings |
| `/api/instagram` | GET, GET /meta, POST /sync*, DELETE /:id* | Instagram feed (official Graph API) |
| `/api/linkedin` | GET, GET /meta, POST /*, DELETE /:id* | LinkedIn feed (curated + auto-enriched) |

*Admin-only routes, protected by JWT.

Admin-mutating routes are protected by JWT middleware.

---

## 🌈 Design Direction

This portfolio follows a strict **monochrome palette with an editorial serif** for the display type. When extending it, keep that restraint — no bolded display serif, generous whitespace, and subtle motion only.

---

## 📜 License

MIT
