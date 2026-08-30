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
  - **Video playback** with its own audio — autoplay muted, on-screen Play/Pause and Mute/Unmute, click-the-video-to-toggle, and auto-hiding controls.
  - WhatsApp-style **collage tiles** for multi-photo cards and a thumbnail strip for jumping between shots.
  - Download button for the active media.
- **Contact & Inquiries** — form with input validation, toast notifications, confetti animations, rate-limiting, and direct database storage.

### Admin Dashboard (`/admin`)
- **Full CRUD** for Projects, Markdown Blog Posts, Skills, Resume Experience, and Profile.
- **Gallery Manager** — upload, tag, and caption photos/videos with **zoom & crop at pick time** (main cover framed 1:1, supporting shots 3:4), inline reordering, starring/featured flags, and per-item delete.
- **Interactive Inbox** — view, star, and reply to client messages.
- **Analytics counters** and quick actions.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, React Router v7, TanStack Query, Framer Motion, React Three Fiber, Lucide Icons |
| **Styling** | Tailwind CSS, PostCSS |
| **Markdown** | React-Markdown, Remark-GFM, Rehype-Highlight |
| **Backend** | Node.js, Express.js (ES Modules), Helmet, Morgan, Express-Rate-Limit, Multer |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt password hashing |
| **Validation** | Zod schema validation middleware |

---

## 🚀 Quick Start

> **Prerequisites:** [Node.js 18+](https://nodejs.org/) and a running [MongoDB](https://www.mongodb.com/) instance (local or Atlas).

### 1. Install Dependencies
From the root directory, this installs root, server, and client dependencies:
```bash
npm run install:all
```

### 2. Environment Variables
Configure `server/.env` (a pre-filled `.env.example` is committed as a template):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/mern_portfolio
JWT_SECRET=supersecretjwtkey_replace_in_production_portfolio_2026
JWT_EXPIRE=30d
ADMIN_EMAIL=admin@portfolio.local
ADMIN_PASSWORD=AdminPass123!
CLIENT_URL=http://localhost:5173
```

### 3. Seed the Database
Populate starter projects, blog posts, skills, resume experiences, gallery items, and admin credentials:
```bash
npm run seed
```

> **Default Admin Account:**
> - **Email:** `admin@portfolio.local`
> - **Password:** `AdminPass123!`

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

## 📂 Project Architecture

```
Portfolio/
├── package.json                 # Root scripts (install, dev, build, seed)
├── README.md
│
├── server/                      # Express REST API
│   ├── config/db.js             # MongoDB connection
│   ├── models/                  # User, Project, BlogPost, Skill,
│   │                            #   Experience, Message, GalleryItem
│   ├── controllers/             # Express route handlers
│   ├── middleware/              # Auth (JWT), Zod validation, error handler, Multer upload
│   ├── routes/                  # /api/* (auth, projects, blog, skills,
│   │                            #   experience, messages, gallery, uploads, stats, profile)
│   ├── uploads/                 # User-uploaded images & videos (git-ignored)
│   ├── utils/seed.js            # Sample database seeder
│   ├── server.js                # Express app entry
│   └── package.json
│
└── client/                      # React (Vite) frontend
    ├── src/
    │   ├── api/client.js        # Axios client & API services
    │   ├── context/             # AuthContext, ThemeContext
    │   ├── components/          # Navbar, Footer, CommandPalette, MarkdownEditor,
    │   │   │                    #   layout, three (3D), common (ImageViewer, SEO, ...)
    │   │   └── common/          # ImageViewer (zoom/pan viewer), ImageCropModal,
    │   │                        #   CommandPalette, SEO, AnimatedText, ...
    │   ├── pages/               # Home, About, Projects, Blog, Skills, Resume, Contact,
    │   │   │                    #   Gallery, GalleryItemDetail, BlogPost, ProjectDetail
    │   │   └── admin/           # Login, Dashboard, ManageGallery, ManageProjects,
    │   │                        #   ManageBlog, ManageSkills, ManageExperiences,
    │   │                        #   Messages, Profile
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
| `/api/upload` | POST `multipart/form-data` | Image/video upload (Multer) |
| `/api/stats` | GET | Dashboard analytics |
| `/api/profile` | GET | Portfolio profile/settings |

Admin-mutating routes are protected by JWT middleware.

---

## 🌈 Design Direction

This portfolio follows a strict **monochrome palette with an editorial serif** for the display type. When extending it, keep that restraint — no bolded display serif, generous whitespace, and subtle motion only.

---

## 📜 License

MIT
