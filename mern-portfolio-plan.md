# MERN Portfolio — Full Project Plan

A professional, minimal, interactive portfolio built on MongoDB, Express, React, and Node, with a full content set (Home, About, Projects, Skills, Blog, Resume, Contact) plus an admin dashboard for content management.

---

## 1. Design Direction

**Style: Minimal Editorial**

- **Background**: white/off-white (`#FAFAFA`) or near-black (`#0F0F0F`) — pick one primary mode, optionally support both via a toggle.
- **Accent color**: exactly one, used sparingly (links, buttons, active states, highlights). Avoid multi-color palettes — this is what keeps it "professional."
- **Typography**:
  - Headings: one distinctive serif or display sans (e.g. "Fraunces", "Playfair Display", or "Space Grotesk" for a more technical feel).
  - Body: clean, readable sans (e.g. "Inter", "IBM Plex Sans").
  - Use a clear type scale (e.g. 1.25 or 1.333 ratio) for hierarchy instead of relying on color/weight alone.
- **Spacing**: generous whitespace, wide margins, avoid clutter. Let content breathe.
- **Interactivity over color**: motion carries the "interactive" feel instead of bright colors.
  - Scroll-triggered fade/slide-ins (Framer Motion `whileInView`)
  - Smooth hover states (underline draw, subtle scale, color shift only on the accent)
  - Optional: custom cursor, magnetic buttons, page transition animation
  - Skip anything gimmicky (particle backgrounds, parallax overload) — restraint is the point.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React (Vite) | Faster dev server than CRA |
| Styling | Tailwind CSS | Enforces restrained, consistent palette via config |
| Animation | Framer Motion | Scroll reveals, transitions, hover interactions |
| Routing | React Router v6 | Public + protected admin routes |
| Data fetching | React Query (TanStack Query) | Caching, loading/error states out of the box |
| Backend | Node.js + Express | REST API |
| Database | MongoDB + Mongoose | Schemas for Projects, Blog, Skills, Messages, User |
| Auth | JWT (jsonwebtoken + bcrypt) | Single-admin login for dashboard |
| Validation | Zod or Joi | Request validation middleware |
| Image storage | Cloudinary or AWS S3 | Never store binary images in MongoDB |
| Email (contact form) | Nodemailer | Or just store messages in DB and view via admin |
| Deployment | Vercel/Netlify (frontend), Render/Railway (backend), MongoDB Atlas (DB) | |

---

## 3. Site Map & Pages

### Public
1. **Home** — hero intro, short pitch/tagline, CTA to Projects/Contact, maybe featured projects preview.
2. **About** — bio, career timeline/experience, values/approach.
3. **Projects** — grid of project cards, filterable by tech tag; click into detail view (modal or dedicated page) with description, stack, screenshots, links (live/repo).
4. **Skills** — grouped by category (Frontend, Backend, Tools, etc.), visual representation (bars, tags, or icon grid).
5. **Blog** — list of posts (title, excerpt, date, tags) → individual post page (Markdown-rendered content).
6. **Resume** — rendered from structured data (not just a static PDF), with a "Download PDF" option generated on the fly or pre-built.
7. **Contact** — form (name, email, message) → hits backend → email notification and/or stored in DB.

### Admin (protected)
8. **Login** — JWT auth, single user (you).
9. **Dashboard** — overview (recent messages, post/project counts).
10. **Manage Projects** — create/edit/delete, upload images.
11. **Manage Blog** — create/edit/delete posts (Markdown editor).
12. **Manage Skills** — create/edit/delete/reorder.
13. **Messages** — view contact form submissions.

---

## 4. Data Models (Mongoose Schemas)

```js
// Project
{
  title: String,
  slug: String,
  description: String,
  longDescription: String,
  techStack: [String],
  images: [String],       // Cloudinary/S3 URLs
  liveUrl: String,
  repoUrl: String,
  featured: Boolean,
  order: Number,
  createdAt: Date
}

// BlogPost
{
  title: String,
  slug: String,
  excerpt: String,
  content: String,        // Markdown
  tags: [String],
  published: Boolean,
  publishedAt: Date,
  createdAt: Date
}

// Skill
{
  name: String,
  category: String,       // e.g. "Frontend", "Backend", "Tools"
  proficiency: Number,    // optional, 1-5 or %
  icon: String,
  order: Number
}

// Message
{
  name: String,
  email: String,
  message: String,
  read: Boolean,
  createdAt: Date
}

// User (admin only, likely just one document)
{
  email: String,
  passwordHash: String
}
```

---

## 5. API Routes

```
GET    /api/projects
GET    /api/projects/:slug
POST   /api/projects            (auth required)
PUT    /api/projects/:id        (auth required)
DELETE /api/projects/:id        (auth required)

GET    /api/blog
GET    /api/blog/:slug
POST   /api/blog                (auth required)
PUT    /api/blog/:id            (auth required)
DELETE /api/blog/:id            (auth required)

GET    /api/skills
POST   /api/skills               (auth required)
PUT    /api/skills/:id           (auth required)
DELETE /api/skills/:id           (auth required)

POST   /api/contact              (public — creates a Message)
GET    /api/messages             (auth required)
PATCH  /api/messages/:id/read    (auth required)

POST   /api/auth/login
GET    /api/auth/me              (auth required)
```

**Middleware:**
- `authMiddleware` — verifies JWT, attaches user to `req`
- `validate(schema)` — Zod/Joi request validation
- `errorHandler` — centralized error responses
- `upload` — Multer + Cloudinary/S3 for image uploads

---

## 6. Folder Structure

```
mern-portfolio/
├── client/                    # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Button, Card, Section, etc.
│   │   │   ├── layout/        # Navbar, Footer, PageTransition
│   │   │   └── admin/         # Dashboard-specific components
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   ├── Skills.jsx
│   │   │   ├── Blog.jsx
│   │   │   ├── BlogPost.jsx
│   │   │   ├── Resume.jsx
│   │   │   ├── Contact.jsx
│   │   │   └── admin/
│   │   │       ├── Login.jsx
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ManageProjects.jsx
│   │   │       ├── ManageBlog.jsx
│   │   │       ├── ManageSkills.jsx
│   │   │       └── Messages.jsx
│   │   ├── hooks/              # useAuth, useProjects, etc.
│   │   ├── context/             # AuthContext
│   │   ├── api/                 # axios instance + API calls
│   │   ├── styles/               # tailwind.config.js, theme tokens
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── tailwind.config.js
│
├── server/                     # Express app
│   ├── models/
│   │   ├── Project.js
│   │   ├── BlogPost.js
│   │   ├── Skill.js
│   │   ├── Message.js
│   │   └── User.js
│   ├── routes/
│   │   ├── projects.js
│   │   ├── blog.js
│   │   ├── skills.js
│   │   ├── contact.js
│   │   ├── messages.js
│   │   └── auth.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validate.js
│   │   └── errorHandler.js
│   ├── controllers/
│   ├── utils/
│   │   └── cloudinary.js
│   ├── config/
│   │   └── db.js
│   ├── server.js
│   └── .env
│
└── README.md
```

---

## 7. Build Order (Milestones)

1. **Backend skeleton** — Express server, MongoDB connection (Atlas), Project schema + CRUD routes, test with Postman/Thunder Client.
2. **Auth** — User model, bcrypt password hashing, JWT login route, auth middleware.
3. **Frontend shell** — Vite + React + Tailwind setup, routing, Navbar/Footer layout, design tokens (colors, fonts, spacing) in `tailwind.config.js`.
4. **Public pages, static first** — build Home/About/Skills/Contact UI with placeholder data to lock in design.
5. **Wire to real API** — replace placeholders with React Query calls to your backend.
6. **Projects + detail view** — grid, filtering, detail modal/page, image upload pipeline (Cloudinary).
7. **Blog** — schema, Markdown rendering (e.g. `react-markdown`), list + detail pages.
8. **Resume** — structured data → rendered page + PDF export (e.g. `react-to-print` or server-side PDF generation).
9. **Contact form** — POST to backend, Nodemailer notification or just store + view in admin.
10. **Admin dashboard** — protected routes, forms for Projects/Blog/Skills CRUD, Messages inbox.
11. **Polish** — Framer Motion scroll reveals, hover interactions, responsive pass (mobile-first check), accessibility check (contrast, focus states, alt text).
12. **SEO & performance** — meta tags, Open Graph, sitemap, image optimization, Lighthouse pass.
13. **Deploy** — frontend to Vercel, backend to Render/Railway, DB on Atlas, connect custom domain.

---

## 8. Nice-to-Have Extensions (later)

- Dark/light mode toggle
- View counter or analytics on projects/blog posts
- Comment system on blog (or keep it comment-free for simplicity)
- RSS feed for blog
- Command palette (Cmd+K) for quick navigation — fits the "interactive, professional" feel well
- i18n if you want multi-language support
