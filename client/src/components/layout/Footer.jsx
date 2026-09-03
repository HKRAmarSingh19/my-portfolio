import React from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Mail, ArrowUp, Lock, Code2 } from "lucide-react";

export const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800/80 bg-white/40 dark:bg-neutral-950/40 mt-24 py-14 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 font-display font-bold text-lg text-neutral-900 dark:text-white"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping inline-block" />
              Hkr. Amar Singh
            </Link>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm leading-relaxed">
              Full-Stack Developer building scalable web applications with MERN, AI/ML, and modern technologies.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-600 dark:text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Open to opportunities & collaborations
            </div>
          </div>
          <div className="flex flex-col space-y-2.5 text-sm">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              Navigation
            </span>
            <div className="grid grid-cols-2 gap-2 text-neutral-600 dark:text-neutral-400">
              <Link
                to="/projects"
                className="hover:text-indigo-500 transition-colors"
              >
                Projects
              </Link>
              <Link
                to="/about"
                className="hover:text-indigo-500 transition-colors"
              >
                About
              </Link>
              <Link
                to="/skills"
                className="hover:text-indigo-500 transition-colors"
              >
                Skills
              </Link>
              <Link
                to="/blog"
                className="hover:text-indigo-500 transition-colors"
              >
                Blog
              </Link>
              <Link
                to="/resume"
                className="hover:text-indigo-500 transition-colors"
              >
                Resume
              </Link>
              <Link
                to="/gallery"
                className="hover:text-indigo-500 transition-colors"
              >
                Gallery
              </Link>
              <Link
                to="/contact"
                className="hover:text-indigo-500 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="space-y-4 flex flex-col md:items-end">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              Get in touch
            </span>
            <div className="flex items-center gap-3">
              {[
                {
                  href: "https://www.linkedin.com/in/hkr-amar-singh-270246308/",
                  Icon: Linkedin,
                  label: "LinkedIn",
                },
                { href: "https://github.com/HKRAmarSingh19", Icon: Github, label: "GitHub" },
                { href: "https://codolio.com/profile/hkramar73", Icon: Code2, label: "Codolio" },
                {
                  href: "https://mail.google.com/mail/?view=cm&fs=1&to=hkramarsingh@gmail.com",
                  Icon: Mail,
                  label: "Email",
                },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  aria-label={label}
                  className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-indigo-500 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 dark:text-neutral-400 hover:text-indigo-500 transition-colors pt-2"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-neutral-200/60 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {year} Hkr.Amar Singh. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono">
              Designed & developed with MERN Stack + Tailwind CSS
            </span>
            <Link
              to="/admin/login"
              className="hover:text-indigo-500 flex items-center gap-1 transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>`&gt;Admin.</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
