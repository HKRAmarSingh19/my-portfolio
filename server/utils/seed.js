import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Project from '../models/Project.js';
import BlogPost from '../models/BlogPost.js';
import Skill from '../models/Skill.js';
import Experience from '../models/Experience.js';
import Message from '../models/Message.js';
import GalleryItem from '../models/GalleryItem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const sampleProjects = [
  {
    title: 'Aura Cloud Storage Platform',
    description: 'A privacy-first decentralized cloud storage web client built on IPFS and zero-knowledge encryption.',
    longDescription: `Aura is an end-to-end encrypted personal cloud storage application. Designed with a minimal monochrome UI, Aura enables users to securely upload, encrypt in-browser, and distribute data fragments across decentralized IPFS nodes.

### Key Highlights:
- **Client-Side Encryption**: AES-GCM 256-bit encryption before files leave the browser.
- **Fast Media Streaming**: Chunked audio/video streaming via streaming API adapters.
- **Access Delegation**: Zero-knowledge shareable links with auto-expiry and password protection.
- **Minimal Editorial Dashboard**: Fluid Framer Motion animations with dark mode support.`,
    category: 'Full Stack',
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Web Crypto API'],
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    ],
    liveUrl: 'https://example.com/aura',
    repoUrl: 'https://github.com/example/aura-cloud',
    featured: true,
    order: 1,
  },
  {
    title: 'Chronicle — Markdown Publishing Engine',
    description: 'An ultra-fast, minimalist publishing suite for engineering teams with Git synchronization and MDX support.',
    longDescription: `Chronicle is a modern CMS and static generation engine crafted for technical writers and developers. It features bidirectional synchronization with GitHub repositories, real-time live preview, and automatic syntax tree optimizations.

### Key Highlights:
- **Bidirectional Git Sync**: Automatic pull & push on markdown changes via GitHub Webhooks.
- **Syntax Highlighting**: Shiki-powered server-side rendering for 100+ languages with dual themes.
- **Typographic Scale**: Handcrafted serif/sans typography scales designed for long-form reading comfort.`,
    category: 'Full Stack',
    techStack: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Framer Motion', 'Tailwind CSS'],
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    ],
    liveUrl: 'https://example.com/chronicle',
    repoUrl: 'https://github.com/example/chronicle-engine',
    featured: true,
    order: 2,
  },
  {
    title: 'Vektor Analytics Engine',
    description: 'Real-time telemetry and API performance monitoring dashboard handling millions of events daily.',
    longDescription: `Vektor is an observability dashboard delivering sub-second query performance over streaming event feeds. Featuring customizable metric widgets, anomaly detection alerts, and distributed trace inspection.`,
    category: 'Backend & Data',
    techStack: ['Node.js', 'Express', 'React', 'MongoDB', 'Redis', 'Chart.js', 'Tailwind CSS'],
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    ],
    liveUrl: 'https://example.com/vektor',
    repoUrl: 'https://github.com/example/vektor-analytics',
    featured: true,
    order: 3,
  },
  {
    title: 'Kanso Minimalist Task Manager',
    description: 'Keyboard-first, distraction-free productivity app inspired by Japanese Kanso (simplicity) principles.',
    longDescription: `Built for deep work, Kanso removes clutter and focuses on friction-free task execution. Includes natural language date parsing, command palette, offline-first sync, and customizable pomodoro sessions.`,
    category: 'Frontend',
    techStack: ['React', 'Tailwind CSS', 'Framer Motion', 'Zustand', 'IndexedDB'],
    coverImage: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=1200&q=80',
    ],
    liveUrl: 'https://example.com/kanso',
    repoUrl: 'https://github.com/example/kanso-app',
    featured: false,
    order: 4,
  },
];

const sampleBlogPosts = [
  {
    title: 'The Art of Minimalist Web Architecture: Less Code, More Impact',
    excerpt: 'How stripping away unnecessary dependencies and focusing on clean fundamentals produces faster, more resilient web systems.',
    content: `# The Art of Minimalist Web Architecture

In modern web development, the natural inclination is often to install a library for every problem. But restraint is one of the most underrated engineering skills.

## 1. Why Minimal Editorial Design Works

When you remove visual noise:
- Users focus on **the message and craftsmanship**.
- Page load times drop drastically.
- Maintenance overhead decreases over the lifecycle of the codebase.

\`\`\`javascript
// Clean, predictable state without unnecessary boilerplate
const useTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') };
};
\`\`\`

## 2. Intentional Micro-interactions

Motion should provide context, not decoration. When a user interacts with a button or navigates between pages, Framer Motion can provide subtle spatial continuity without causing cognitive fatigue.

## 3. Conclusion

Choose your dependencies intentionally. Every kilobyte shipped over the wire must justify its existence.`,
    tags: ['Architecture', 'Design Systems', 'Performance', 'React'],
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    published: true,
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Building Resilient Full-Stack Applications with MERN in 2026',
    excerpt: 'A practical deep dive into patterns for structuring robust Node.js, Express, and MongoDB backends alongside modern React frontends.',
    content: `# Building Resilient Full-Stack Applications with MERN

The MERN stack remains a powerhouse for web applications when implemented with strict types, request validation, and clean architectural separation.

## Key Architectural Principles

1. **Centralized Error Handling**: Never let uncaught exceptions crash the server.
2. **Schema-First Validation**: Use Zod to validate payloads at the route perimeter before data touches business logic.
3. **Optimistic UI with TanStack Query**: Keep client and server in seamless harmony.

\`\`\`javascript
// Perimeter validation with Zod
export const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync(req.body);
    next();
  } catch (err) {
    res.status(400).json({ error: err.errors });
  }
};
\`\`\`

By embracing these patterns, your full-stack apps stay reliable as they scale.`,
    tags: ['MERN', 'Node.js', 'MongoDB', 'Architecture'],
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
    published: true,
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Mastering Framer Motion for Editorial Web Experiences',
    excerpt: 'Techniques for crafting buttery smooth transitions, scroll reveals, and magnetic interactions with Framer Motion.',
    content: `# Mastering Framer Motion for Editorial Web Experiences

Fluid motion bridges the gap between static print editorial design and interactive digital software.

## Key Techniques

- **Scroll Reveals with \`whileInView\`**: Stagger child elements gently as the viewport enters.
- **Layout Animations with \`layoutId\`**: Morphing elements across route transitions.
- **Spring Physics**: Opt for physics-based springs over fixed easing curves for natural responsiveness.`,
    tags: ['Framer Motion', 'Frontend', 'Animation', 'UX'],
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    published: true,
    publishedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
  },
];

const sampleSkills = [
  { name: 'React & React 19', category: 'Frontend', proficiency: 95, yearsOfExperience: 4, order: 1 },
  { name: 'JavaScript (ESNext) / TypeScript', category: 'Frontend', proficiency: 92, yearsOfExperience: 4, order: 2 },
  { name: 'Tailwind CSS & CSS Modules', category: 'Frontend', proficiency: 95, yearsOfExperience: 4, order: 3 },
  { name: 'Framer Motion', category: 'Frontend', proficiency: 88, yearsOfExperience: 3, order: 4 },
  { name: 'TanStack Query (React Query)', category: 'Frontend', proficiency: 90, yearsOfExperience: 3, order: 5 },
  { name: 'Node.js & Express', category: 'Backend', proficiency: 92, yearsOfExperience: 4, order: 1 },
  { name: 'RESTful API Architecture', category: 'Backend', proficiency: 94, yearsOfExperience: 4, order: 2 },
  { name: 'JWT & OAuth2 Authentication', category: 'Backend', proficiency: 90, yearsOfExperience: 3, order: 3 },
  { name: 'Microservices & Serverless', category: 'Backend', proficiency: 80, yearsOfExperience: 2, order: 4 },
  { name: 'MongoDB & Mongoose', category: 'Database', proficiency: 90, yearsOfExperience: 4, order: 1 },
  { name: 'Redis Caching', category: 'Database', proficiency: 82, yearsOfExperience: 2, order: 2 },
  { name: 'PostgreSQL', category: 'Database', proficiency: 78, yearsOfExperience: 2, order: 3 },
  { name: 'Git, GitHub & CI/CD Actions', category: 'DevOps & Cloud', proficiency: 90, yearsOfExperience: 4, order: 1 },
  { name: 'Docker & Containerization', category: 'DevOps & Cloud', proficiency: 82, yearsOfExperience: 2, order: 2 },
  { name: 'Vercel / Render / AWS Deployment', category: 'DevOps & Cloud', proficiency: 85, yearsOfExperience: 3, order: 3 },
  { name: 'Vite & Webpack', category: 'Tools & Workflow', proficiency: 88, yearsOfExperience: 3, order: 1 },
  { name: 'Zod & Request Validation', category: 'Tools & Workflow', proficiency: 92, yearsOfExperience: 3, order: 2 },
  { name: 'Figma & UI Prototyping', category: 'Tools & Workflow', proficiency: 85, yearsOfExperience: 3, order: 3 },
  { name: 'Postman & API Testing', category: 'Tools & Workflow', proficiency: 90, yearsOfExperience: 4, order: 4 },
];

const sampleExperiences = [
  {
    type: 'work',
    title: 'Senior Full-Stack Software Engineer',
    organization: 'Apex Digital Labs',
    location: 'Remote / San Francisco, CA',
    startDate: '2023',
    endDate: 'Present',
    current: true,
    description: 'Leading architecture and development of scalable full-stack web applications and client dashboards using MERN and modern cloud infrastructure.',
    highlights: [
      'Architected high-throughput REST APIs handling 500k+ daily requests with 99.98% uptime.',
      'Refactored legacy monolith into modular services, cutting latency by 45%.',
      'Mentored 6 junior engineers and established automated CI/CD deployment pipelines.',
    ],
    techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Docker'],
    order: 1,
  },
  {
    type: 'work',
    title: 'Full-Stack Developer',
    organization: 'Nexus Software Studio',
    location: 'Austin, TX',
    startDate: '2021',
    endDate: '2023',
    current: false,
    description: 'Engineered responsive web applications and interactive client portals with custom backend integrations and database schemas.',
    highlights: [
      'Built 15+ production full-stack web apps from design to deployment.',
      'Implemented real-time websockets chat and notification engines.',
      'Reduced initial page bundle sizes by 40% through code splitting and tree-shaking.',
    ],
    techStack: ['React', 'Node.js', 'MongoDB', 'Express', 'TanStack Query'],
    order: 2,
  },
  {
    type: 'education',
    title: 'Bachelor of Science in Computer Science',
    organization: 'State University Institute of Technology',
    location: 'San Jose, CA',
    startDate: '2017',
    endDate: '2021',
    current: false,
    description: 'Graduated with Honors. Focused on Distributed Systems, Algorithms, and Human-Computer Interaction.',
    highlights: [
      'Dean’s Honor List for 6 consecutive semesters.',
      'Led ACM Student Chapter Web Development Workshops.',
    ],
    techStack: ['Data Structures', 'Algorithms', 'Distributed Systems', 'Database Engineering'],
    order: 3,
  },
];

const sampleMessages = [  {
    name: 'Eleanor Vance',
    email: 'eleanor.vance@studioforge.io',
    subject: 'Project Collaboration Opportunity',
    message: 'Hello! I was deeply impressed by your minimal editorial portfolio and engineering depth. We have an upcoming client platform redesign and would love to discuss a potential partnership.',
    read: false,
    starred: true,
  },
  {
    name: 'Marcus Sterling',
    email: 'marcus@sterlingventures.com',
    subject: 'Senior Full Stack Role Inquiry',
    message: 'Hi there! We are looking for a senior engineer with your MERN and clean UI skillset. Are you currently open to full-time or contract discussions?',
    read: true,
    starred: false,
  },
];

const sampleGalleryItems = [
  {
    title: 'Alpine Sunrise',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    category: 'Travel',
    description: 'Golden light breaking over the mountain ridge after an early ascent.',
    featured: true,
    order: 1,
  },
  {
    title: 'Coastal Minimalism',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    category: 'Travel',
    description: 'A quiet stretch of shoreline, framed by clean horizon lines.',
    featured: true,
    order: 2,
  },
  {
    title: 'Desk in Monochrome',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    category: 'Workspace',
    description: 'Personal studio setup — the corner where most of this portfolio was built.',
    featured: true,
    order: 3,
  },
  {
    title: 'Forest Light',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
    category: 'Personal',
    description: 'Dappled sun filtering through a dense canopy during an afternoon walk.',
    featured: false,
    order: 4,
  },
  {
    title: 'Studio Warmth',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    category: 'Workspace',
    description: 'Warm team workspace shot from an all-hands meetup.',
    featured: false,
    order: 5,
  },
  {
    title: 'Urban Geometry',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
    category: 'Personal',
    description: 'Patterns and shadows found in the city during a lunch break.',
    featured: false,
    order: 6,
  },
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mern_portfolio';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await BlogPost.deleteMany({});
    await Skill.deleteMany({});
    await Experience.deleteMany({});
    await Message.deleteMany({});
    await GalleryItem.deleteMany({});

    console.log('[Seed] Creating default Admin account...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@portfolio.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';

    const admin = await User.create({
      name: 'Amar Singh',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      avatar: '/profile.jpeg',
      bio: 'Full-Stack Software Engineer specializing in minimal editorial interfaces and high-performance MERN architecture.',
    });
    console.log(`[Seed] Created Admin User: ${admin.email}`);

    console.log('[Seed] Seeding projects...');
    await Project.create(sampleProjects);

    console.log('[Seed] Seeding blog posts...');
    await BlogPost.create(sampleBlogPosts);

    console.log('[Seed] Seeding skills...');
    await Skill.create(sampleSkills);

    console.log('[Seed] Seeding experiences & resume data...');
    await Experience.create(sampleExperiences);

    console.log('[Seed] Seeding sample messages...');
    await Message.create(sampleMessages);

    console.log('[Seed] Seeding gallery items...');
    await GalleryItem.create(sampleGalleryItems);

    console.log('✅ [Seed] Database seeded successfully with full starter dataset!');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed] Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDB();

