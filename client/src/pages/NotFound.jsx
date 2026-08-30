import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, FolderGit2, Layers, Mail } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';

// Somewhere useful to go, since the requested URL wasn't.
const SUGGESTIONS = [
  { to: '/projects', label: 'Projects', icon: FolderGit2 },
  { to: '/skills', label: 'Skills', icon: Layers },
  { to: '/contact', label: 'Contact', icon: Mail },
];

export const NotFound = () => (
  <PageTransition>
    <SEO title="Page Not Found (404)" />

    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-x-clip px-4 text-center">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.10] blur-3xl" />
      </div>

      {/* The numeral itself is the graphic — large, gradient-filled, and sitting
          behind the message rather than competing with it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute select-none bg-gradient-to-br from-indigo-500/25 to-violet-600/10 bg-clip-text font-display text-[12rem] font-bold leading-none text-transparent sm:text-[18rem]"
      >
        404
      </span>

      <div className="relative space-y-6">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow-lg">
          <Compass className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Error 404
          </span>
          <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-neutral-900 dark:text-white">
            Coordinates Unreachable
          </h1>
          <p className="mx-auto max-w-sm text-sm text-neutral-500">
            The page or resource you requested could not be located.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return Home</span>
          </Link>

          {SUGGESTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-medium text-neutral-600 transition-colors hover:border-indigo-500/40 hover:text-indigo-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-indigo-400"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  </PageTransition>
);
export default NotFound;
