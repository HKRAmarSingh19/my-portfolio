import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Sparkles, Github, Images, X, ArrowLeftRight } from 'lucide-react';
import { projectsApi, blogApi, skillsApi, profileApi, galleryApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import Scene3D from '../components/three/Scene3D';
import TiltCard from '../components/common/TiltCard';
import MagneticButton from '../components/common/MagneticButton';
import AnimatedText from '../components/common/AnimatedText';
import Counter from '../components/common/Counter';
import Marquee from '../components/common/Marquee';
import Spotlight from '../components/common/Spotlight';
import ProfilePortrait from '../components/common/ProfilePortrait';
import ProfilePortraitCarousel from '../components/common/ProfilePortraitCarousel';
import ImageViewer from '../components/common/ImageViewer';
import { TechBadgeList } from '../components/common/TechBadge';
import { resolveTechIcon } from '../components/common/techIcons';

export const Home = () => {
  const prefersReducedMotion = useReducedMotion();

  // Full project list: drives the "Projects Shipped" counter (total, not
  // featured-only). Featured section filters in-memory below.
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll({}),
  });

  const { data: blogData, isLoading: blogLoading } = useQuery({
    queryKey: ['recentBlog'],
    queryFn: () => blogApi.getAll({ publishedOnly: true }),
  });

  const { data: skillsData } = useQuery({
    queryKey: ['homeSkills'],
    queryFn: () => skillsApi.getAll({}),
  });

  // Featured images for the home gallery strip — full list isn't needed.
  const { data: galleryData, isLoading: galleryLoading } = useQuery({
    queryKey: ['homeFeaturedGallery'],
    queryFn: () => galleryApi.getAll({ featured: true }),
  });

  // Portrait + name are admin-editable, so they come from the API rather than
  // being hard-coded here. Falls back to the bundled defaults on failure.
  // staleTime: 0 — the profile changes whenever the admin updates it; a stale
  // cached payload (from before a change) would show the wrong portrait.
  const { data: profileData } = useQuery({
    queryKey: ['publicProfile'],
    queryFn: () => profileApi.get(),
    staleTime: 0,
  });

  const profile = profileData?.data?.data || {};

  // Featured profile photos rotate in the hero carousel (only on Home). Falls
  // back to the single avatar portrait when none are featured.
  const featuredProfileImages = (profile.featuredImages || []).filter(Boolean);

  const featuredProjects =
    projectsData?.data?.data?.filter((p) => p.featured).slice(0, 3) || [];
  const recentPosts = blogData?.data?.data?.slice(0, 2) || [];
  const featuredGallery = (galleryData?.data?.data || []).slice(0, 4);
  const allSkills = skillsData?.data?.data || [];
  const topSkills = allSkills.slice(0, 8);

  // In-place fullscreen viewer for the featured gallery tiles. `lightboxIndex`
  // is the index into `featuredGallery` of the tile being examined, or null
  // when closed. `lbImageIdx` is the photo within that item's set.
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lbImageIdx, setLbImageIdx] = useState(0);

  const activeGalleryItem = lightboxIndex !== null ? featuredGallery[lightboxIndex] : null;
  const activeGalleryImages = activeGalleryItem
    ? Array.from(
        new Set([
          activeGalleryItem.image,
          ...(activeGalleryItem.images || []),
          activeGalleryItem.video,
        ].filter(Boolean))
      )
    : [];

  const openGalleryLightbox = (item, tileIdx = 0) => {
    setLbImageIdx(Number.isFinite(tileIdx) && tileIdx >= 0 ? tileIdx : 0);
    setLightboxIndex(featuredGallery.indexOf(item));
  };
  const closeGalleryLightbox = () => setLightboxIndex(null);
  // Wrapped so a stray event object is never passed to the setter (React 18+
  // coerce issue). Always receives a plain number from ImageViewer.
  const moveGalleryImage = (next) => {
    if (typeof next === 'number' && Number.isFinite(next)) setLbImageIdx(next);
  };
  // Prevent the page behind from scrolling while the lightbox is open.
  React.useEffect(() => {
    if (lightboxIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [lightboxIndex]);
  const skillNames = allSkills.map((skill) => skill.name);

  const stats = [
    {
      value: projectsData?.data?.count || 0,
      label: 'Projects Shipped',
      suffix: '+',
    },
    {
      value: allSkills?.length || 0,
      label: 'Technologies',
      suffix: '+',
    },
    {
      value: new Date().getFullYear() - 2024, // Assuming Amar started in 2024
      label: 'Years Building',
      suffix: '+',
    },
    {
      value: 100,
      label: 'Commitment',
      suffix: '%',
    },
  ];

  return (
    <PageTransition>
      <SEO title="Software Engineer & System Architect" description="Minimal editorial portfolio of Amar Singh — Full-Stack MERN Software Engineer." />

      {/* Anchors the page the same way as the other routes: overflow-x-clip keeps
          the fixed header's anchor-scroll working (overflow-hidden would trap it),
          and the two blooms give the hero the same soft ambience as every page. */}
      <div className="relative overflow-x-clip">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] overflow-hidden"
        >
          <div className="absolute -top-32 left-0 h-[26rem] w-[26rem] rounded-full bg-indigo-500/[0.10] blur-3xl sm:left-16" />
          <div className="absolute -top-20 right-0 h-[20rem] w-[20rem] rounded-full bg-violet-500/[0.08] blur-3xl sm:right-24" />
        </div>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative pt-24 sm:pt-32 pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6 relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs font-mono text-neutral-600 dark:text-neutral-300"
            >
              {/* Green is reserved for live status across the site — one status dot here. */}
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 animate-pulse-ring" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="whitespace-nowrap">B.Tech CSE ’28</span>
              <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">•</span>
              <span className="whitespace-nowrap">Backend Developer</span>
              <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">•</span>
              <span className="whitespace-nowrap">AI Enthusiast</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.05]">
              <AnimatedText text="< Building" />{' '}
              <motion.span
                initial={{ opacity: 0, y: '0.25em' }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-gradient animate-gradient-pan inline-block"
              >
                Scalable
              </motion.span>{' '}

              <AnimatedText text="System & " delay={0.5} />{' '}
              <span className="italic text-indigo-600 dark:text-indigo-400">

                <AnimatedText text="AI-Powered" delay={0.75} />
              </span>{' '}

              <AnimatedText text="Solutions. />" delay={0.85} />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl leading-relaxed font-light"
            >
              <p className="text-white-600">
                {profile.bio || (
                  <>
                    I’m Hkr. Amar Singh — a Computer Science student who loves turning complex problems into clean, scalable{" "}
                    <span className="text-blue-500 font-semibold">software</span>.
                    From building{" "}
                    <span className="text-blue-500 font-semibold">full-stack applications</span>{" "}
                    with the MERN stack & solving DSA problems in Java and exploring{" "}
                    <span className="text-blue-500 font-semibold">Generative & Agentic AI</span>,
                    I’m constantly learning, building, and pushing my engineering skills further.
                  </>
                )}
              </p>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.15 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4"
            >
              <MagneticButton
                as={Link}
                to="/projects"
                className="group relative inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-medium text-sm overflow-hidden shadow-lift hover:shadow-glow transition-shadow duration-300"
              >
                {/* Sheen sweep on hover. */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span className="relative">View My Work</span>
                <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>

              <MagneticButton
                as={Link}
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass text-neutral-800 dark:text-neutral-200 hover:border-indigo-500/50 font-medium text-sm transition-colors"
              >
                <span>Let's Connect</span>
              </MagneticButton>
            </motion.div>
          </div>

          {/* Portrait leads, with the lazy-loaded 3D scene as its aura. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative order-first lg:order-last flex flex-col items-center"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-indigo-500/10 blur-3xl scale-90"
            />
            {/* Overhangs the portrait so the knot and particles read through the
                margins. pointer-events-none keeps the portrait tilt interactive —
                the scene tracks the window pointer, so parallax still works. */}
            <Scene3D className="pointer-events-none absolute -inset-8 sm:-inset-12 opacity-70 dark:opacity-80" />
            <div className="relative mx-auto w-full max-w-[15rem] sm:max-w-xs lg:max-w-none">
              {featuredProfileImages.length > 0 ? (
                <ProfilePortraitCarousel
                  images={featuredProfileImages}
                  name={profile.name}
                  headline={profile.headline}
                />
              ) : (
                <ProfilePortrait src={profile.avatar} name={profile.name} />
              )}
            </div>

            {/* Identity card — clean info chip under the portrait, raised above
                the aura overlay so it stays readable on any background. */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="relative mt-6 w-full max-w-xs rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/70 backdrop-blur px-4 py-3 text-center shadow-lift"
            >
              <p className="truncate font-display text-sm font-semibold text-neutral-900 dark:text-white">
                {profile.name}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {profile.headline}
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Live tech ticker. */}
        {skillNames.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="mt-14 pt-8 border-t border-neutral-200/70 dark:border-neutral-800/70 space-y-3"
          >
            <span className="block text-center lg:text-left font-mono text-[11px] uppercase tracking-widest text-neutral-400">
              Working with
            </span>
            <Marquee items={skillNames} />
          </motion.div>
        )}
      </section>

      {/* ── Stat band ────────────────────────────────────────────────────── */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group relative p-6 rounded-2xl glass overflow-hidden hover:border-indigo-500/40 transition-colors text-center"
            >
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative text-3xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white tabular-nums">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="relative text-[11px] font-mono uppercase tracking-wider text-neutral-400 mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Featured projects ────────────────────────────────────────────── */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-200/70 dark:border-neutral-800/70">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 text-center sm:text-left">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Selected Work</span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white mt-1 tracking-tight">
              <AnimatedText text="Featured Projects" inView />
            </h2>
          </div>
          <Link
            to="/projects"
            className="link-underline inline-flex items-center justify-center sm:justify-start gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-indigo-500 transition-colors group"
          >
            <span>View all projects</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project, index) => (
              <motion.div
                key={project._id || index}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard className="h-full rounded-2xl">
                  <div className="group relative h-full rounded-2xl glass overflow-hidden flex flex-col justify-between hover:border-indigo-500/40 hover:shadow-lift transition-all duration-300">
                    {project.coverImage && (
                      <div className="relative h-44 overflow-hidden bg-neutral-100 dark:bg-neutral-950">
                        <img
                          src={project.coverImage}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/10 to-transparent" />
                        <span className="absolute bottom-3 left-3 text-[11px] font-mono uppercase tracking-wider text-indigo-300 bg-neutral-950/70 backdrop-blur px-2 py-0.5 rounded border border-indigo-500/30">
                          {project.category || 'Full Stack'}
                        </span>
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4" style={{ transform: 'translateZ(24px)' }}>
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/projects/${project.slug || project._id}`}>
                            <h3 className="text-lg font-display font-bold text-neutral-900 dark:text-white group-hover:text-indigo-500 transition-colors leading-snug">
                              {project.title}
                            </h3>
                          </Link>
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 text-neutral-400 hover:text-indigo-500 transition-colors"
                              aria-label={`${project.title} live demo`}
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-200/70 dark:border-neutral-800/70">
                        {/* Logo chips — same component as the Projects page, so a
                            technology looks identical wherever it appears. */}
                        <TechBadgeList items={project.techStack} limit={4} />
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── Featured gallery ─────────────────────────────────────────────── */}
      {featuredGallery.length > 0 && (
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-200/70 dark:border-neutral-800/70">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 text-center sm:text-left">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Visual Archive</span>
              <h2 className="text-2xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white mt-1 tracking-tight">
                <AnimatedText text="Featured Gallery" inView />
              </h2>
            </div>
            <Link
              to="/gallery"
              className="link-underline inline-flex items-center justify-center sm:justify-start gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-indigo-500 transition-colors group"
            >
              <span>View full gallery</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {galleryLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredGallery.map((item, index) => {
                const media = item.video
                  ? [item.image, item.video].filter(Boolean)
                  : [item.image, ...(item.images || [])].filter(Boolean);
                const poster = item.image || item.video;
                return (
                  <motion.div
                    key={item._id || index}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => openGalleryLightbox(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openGalleryLightbox(item);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${item.title} full screen`}
                    className="group relative block cursor-pointer overflow-hidden rounded-2xl glass aspect-square hover:border-indigo-500/40 hover:shadow-lift transition-all duration-300"
                  >
                    {poster ? (
                      <img
                        src={poster}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/10 to-transparent" />
                    {media.length > 1 && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-neutral-950/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur">
                        +{media.length - 1} media
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 text-[11px] font-mono uppercase tracking-wider text-indigo-300 bg-neutral-950/70 backdrop-blur px-2 py-0.5 rounded border border-indigo-500/30">
                      {item.category || 'Personal'}
                    </span>
                    <span className="absolute bottom-3 right-3 text-xs font-display font-bold text-white drop-shadow">
                      {item.title}
                    </span>
                    {/* Expand affordance — hints the tile opens the fullscreen
                        viewer on click (and touch does the same). */}
                    <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-neutral-950/60 text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
                      {item.video ? <ArrowLeftRight className="h-3.5 w-3.5" /> : <Images className="h-3.5 w-3.5" />}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Capabilities ─────────────────────────────────────────────────── */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-200/70 dark:border-neutral-800/70">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4 flex flex-col items-center lg:items-start text-center lg:text-left">
            <span className="font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Capabilities</span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white tracking-tight">
              <AnimatedText text="Full-Stack Architecture & Modern Tooling" inView />
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Specialized in engineering robust Node.js and Express APIs, modern component
              architectures with React, scalable MongoDB document models, and streamlined CI/CD
              pipelines.
            </p>
            <div className="pt-2">
              <Link
                to="/skills"
                className="link-underline inline-flex items-center justify-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400"
              >
                <span>Explore all technical proficiencies</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {topSkills.map((skill, index) => {
              // Same brand-logo lookup as the Skills page, so a technology's
              // mark looks identical wherever it appears.
              const tech = resolveTechIcon(skill.name);
              const SkillIcon = tech?.Icon || null;
              const tileStyle = tech?.color ? { backgroundColor: `${tech.color}1F` } : undefined;
              const iconStyle = tech?.color ? { color: tech.color } : undefined;

              return (
                <motion.div
                  key={skill._id || index}
                  initial={{ opacity: 0, scale: 0.9, y: 12 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={prefersReducedMotion ? undefined : { y: -5, transition: { duration: 0.2 } }}
                  className="group relative flex flex-col items-start gap-3 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/70 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:border-indigo-500/40 hover:shadow-glow overflow-hidden"
                >
                  {/* Hover accent */}
                  <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Soft corner glow on hover */}
                  <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-indigo-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />
                  <div
                    style={tileStyle}
                    className={`grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
                      tech?.color ? '' : 'bg-neutral-100 dark:bg-neutral-800'
                    }`}
                  >
                    {SkillIcon ? (
                      <SkillIcon
                        aria-hidden="true"
                        style={iconStyle}
                        className={`h-5 w-5 ${tech?.color ? '' : 'text-neutral-700 dark:text-neutral-200'}`}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-1">
                      {skill.name}
                    </h4>
                    <span className="mt-0.5 block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                      {skill.category}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Recent writing ───────────────────────────────────────────────── */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-neutral-200/70 dark:border-neutral-800/70">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4 text-center sm:text-left">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Engineering Log</span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white mt-1 tracking-tight">
              <AnimatedText text="Recent Writing" inView />
            </h2>
          </div>
          <Link
            to="/blog"
            className="link-underline inline-flex items-center justify-center sm:justify-start gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-indigo-500 transition-colors group"
          >
            <span>Read all articles</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {blogLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-32 rounded-2xl bg-neutral-100 dark:bg-neutral-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {recentPosts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  to={`/blog/${post.slug || post._id}`}
                  className="group relative block p-6 rounded-2xl glass hover:border-indigo-500/40 hover:shadow-lift transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-indigo-500 scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-500" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-neutral-400">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'} • {post.readingTime || 5} min read
                    </span>
                    <div className="flex items-center gap-2">
                      {post.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-neutral-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Spotlight className="rounded-3xl border border-neutral-800 bg-neutral-900 text-white grain">
          <div className="absolute inset-0 bg-dots opacity-30" aria-hidden="true" />
          <div className="relative p-8 sm:p-14 max-w-2xl space-y-4 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              Let's build something remarkable
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight leading-[1.1]">
              <AnimatedText text="Have a project in mind or looking for a senior full-stack engineer?" inView />
            </h2>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              I am open to consulting engagements, architectural reviews, and full-time technical
              leadership roles.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <MagneticButton
                as={Link}
                to="/contact"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors shadow-glow"
              >
                <span>Start a Conversation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
              <MagneticButton
                as={Link}
                to="/resume"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm transition-colors border border-neutral-700"
              >
                <Github className="w-4 h-4" />
                <span>View Structured Resume</span>
              </MagneticButton>
            </div>
          </div>
        </Spotlight>
      </section>

      {/* ── Featured-gallery fullscreen viewer ─────────────────────────────
          Opened by tapping/clicking a gallery tile. Same Google-Maps style
          ImageViewer as the /gallery lightbox: wheel/pinch zoom, drag pan,
          prev/next within the active item, fullscreen + download. Clicking the
          backdrop (or the X) closes it. */}
      <AnimatePresence>
      {activeGalleryItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onWheel={(e) => e.preventDefault()}
          onTouchMove={(e) => e.preventDefault()}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md sm:p-10"
          onClick={closeGalleryLightbox}
        >
          <button
            onClick={closeGalleryLightbox}
            aria-label="Close fullscreen view"
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-neutral-200 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="m-auto flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageViewer
              images={activeGalleryImages}
              index={lbImageIdx}
              onIndexChange={moveGalleryImage}
              itemId={activeGalleryItem._id}
              itemTitle={activeGalleryItem.title}
              title={activeGalleryItem.title}
              caption={activeGalleryItem.description}
              videoHls={activeGalleryItem.videoHls}
              onPrevSet={() => {
                setLbImageIdx(0);
                setLightboxIndex(
                  (i) => (i - 1 + featuredGallery.length) % featuredGallery.length
                );
              }}
              onNextSet={() => {
                setLbImageIdx(0);
                setLightboxIndex((i) => (i + 1) % featuredGallery.length);
              }}
            />
          </div>
        </motion.div>
      )}
      </AnimatePresence>
      </div>
    </PageTransition>
  );
};
export default Home;
