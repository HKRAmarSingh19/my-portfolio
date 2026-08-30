# Full-Stack Minimal Editorial MERN Portfolio

A modern, high-performance, minimal editorial portfolio application built on **MongoDB, Express.js, React 19 (Vite), and Node.js**, styled with **Tailwind CSS** and animated with **Framer Motion**.

---

## 🌟 Key Features

- **Minimal Editorial Aesthetic**: Refined typography pairings, restrained palette (light/dark mode toggle), generous whitespace, and subtle Framer Motion micro-interactions.
- **Interactive Command Palette**: Press `⌘K` or `Ctrl+K` for instant keyboard navigation, theme switching, and quick actions.
- **Project Showcase**: Tag/category filtering, real-time search, responsive card grids, and dedicated markdown-supported case study pages.
- **Categorized Skills Directory**: Visual proficiency bars and years of experience across Frontend, Backend, Cloud/DevOps, Database, and Tooling.
- **Technical Blog**: Markdown-rendered articles with syntax highlighting, topic pills, reading time estimates, and view tracking.
- **Structured Interactive Resume**: Built from dynamic database schema with print-to-PDF stylesheet optimization.
- **Contact & Inquiries**: Form with input validation, toast notifications, confetti animations, rate-limiting, and direct database storage.
- **Protected Admin Dashboard (`/admin`)**:
  - Full CRUD management for Projects, Markdown Blog Posts, Skills, and Resume Experience.
  - Interactive Inbox for viewing, starring, and replying to client messages.
  - Analytics counters and quick actions.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, React Router v7, TanStack Query, Framer Motion, Lucide Icons |
| **Styling** | Tailwind CSS, PostCSS, Typography Tokens |
| **Markdown** | React-Markdown, Remark-GFM, Rehype-Highlight |
| **Backend** | Node.js, Express.js (ES Modules), Helmet, Morgan, Express-Rate-Limit |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt password hashing |
| **Validation** | Zod Schema Validation Middleware |

---

## 🚀 Quick Start

### 1. Install Dependencies
Run from the root directory to install dependencies for root, server, and client:
```bash
npm run install:all
```

### 2. Environment Variables
Configure `server/.env` (a pre-filled `.env` and `.env.example` are provided):
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

### 3. Seed Database with Starter Content
Populate initial projects, blog posts, skills, resume experiences, and admin credentials:
```bash
npm run seed
```

> **Default Admin Account:**
> - **Email:** `admin@portfolio.local`
> - **Password:** `AdminPass123!`

### 4. Start Development Servers
Start both backend API (`localhost:5000`) and frontend Vite client (`localhost:5173`) concurrently:
```bash
npm run dev
```

---

## 📂 Project Architecture

```
Portfolio/
├── package.json                 # Root scripts (install:all, dev, build)
├── server/                      # Express REST API
│   ├── config/db.js             # MongoDB connection
│   ├── models/                  # Project, BlogPost, Skill, Message, User, Experience
│   ├── controllers/             # Express route handlers
│   ├── middleware/              # Auth, Zod validation, Error handlers, Multer
│   ├── routes/                  # API endpoints (/api/*)
│   ├── utils/seed.js            # Sample database seeder
│   ├── server.js                # Express app entry
│   └── package.json
│
├── client/                      # React (Vite) Frontend
│   ├── src/
│   │   ├── api/client.js        # Axios client & API services
│   │   ├── context/             # AuthContext, ThemeContext
│   │   ├── components/          # Navbar, Footer, CommandPalette, MarkdownEditor, AdminLayout
│   │   ├── pages/               # Home, About, Projects, Blog, Skills, Resume, Contact
│   │   │   └── admin/           # Login, Dashboard, ManageProjects, ManageBlog, ManageSkills, Messages
│   │   ├── styles/index.css     # Editorial styles & print rules
│   │   ├── App.jsx              # Main routing tree
│   │   └── main.jsx             # React entry point
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── mern-portfolio-plan.md       # Original specification plan
```

---

## 📜 License
MIT

