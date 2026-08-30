import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CommandPalette from './components/common/CommandPalette';
import ErrorBoundary from './components/common/ErrorBoundary';
import AdminLayout from './components/admin/AdminLayout';
import ScrollProgress from './components/common/ScrollProgress';
import AmbientBackground from './components/common/AmbientBackground';
import Intro from "./components/Intro";

import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Skills from './pages/Skills';
import Gallery from './pages/Gallery';
import GalleryItemDetail from './pages/GalleryItemDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Resume from './pages/Resume';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Profile from './pages/admin/Profile';
import ManageProjects from './pages/admin/ManageProjects';
import ManageBlog from './pages/admin/ManageBlog';
import ManageSkills from './pages/admin/ManageSkills';
import ManageExperiences from './pages/admin/ManageExperiences';
import ManageGallery from './pages/admin/ManageGallery';
import Messages from './pages/admin/Messages';


export function App() {
  const location = useLocation();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');

  const [showIntro, setShowIntro] = useState(true);


  return (
    <div className="min-h-screen flex flex-col justify-between text-neutral-900 dark:text-neutral-100 transition-colors duration-200 selection:bg-indigo-600 selection:text-white">
      {isAdminRoute && <div className="fixed inset-0 -z-10 bg-background-light dark:bg-background-dark" />}
      {!isAdminRoute && (
        <>

          <AmbientBackground />
          <ScrollProgress />
          <Navbar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
          />
        </>
      )}

      <div className="flex-1">

        {showIntro && !isAdminRoute && location.pathname === '/' ? (
          <Intro onComplete={() => setShowIntro(false)} />
        ) : (
          <ErrorBoundary>
          <AnimatePresence mode="wait">

            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<ProjectDetail />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/gallery/:id" element={<GalleryItemDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/resume" element={<Resume />} />
              <Route path="/contact" element={<Contact />} />

              <Route path="/admin/login" element={<Login />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="projects" element={<ManageProjects />} />
                <Route path="blog" element={<ManageBlog />} />
                <Route path="skills" element={<ManageSkills />} />
                <Route path="experience" element={<ManageExperiences />} />
                <Route path="gallery" element={<ManageGallery />} />
                <Route path="messages" element={<Messages />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
          </ErrorBoundary>)}
      </div>

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
