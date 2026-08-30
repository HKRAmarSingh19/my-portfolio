import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderGit2, BookOpen, Layers, User, FileText, Mail, Sun, Moon, Copy, Check, ExternalLink, Images } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navigationCommands = [
    { label: 'Go to Projects', icon: FolderGit2, action: () => { navigate('/projects'); onClose(); } },
    { label: 'Go to About Me', icon: User, action: () => { navigate('/about'); onClose(); } },
    { label: 'Go to Skills Directory', icon: Layers, action: () => { navigate('/skills'); onClose(); } },
    { label: 'Go to Gallery', icon: Images, action: () => { navigate('/gallery'); onClose(); } },
    { label: 'Go to Technical Blog', icon: BookOpen, action: () => { navigate('/blog'); onClose(); } },
    { label: 'View Resume & Experience', icon: FileText, action: () => { navigate('/resume'); onClose(); } },
    { label: 'Contact & Inquiries', icon: Mail, action: () => { navigate('/contact'); onClose(); } },
  ];

  const quickActionCommands = [
    {
      label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      icon: theme === 'dark' ? Sun : Moon,
      action: () => { toggleTheme(); onClose(); },
    },
    {
      label: copied ? 'Email Copied to Clipboard!' : 'Copy Email Address (amar@example.com)',
      icon: copied ? Check : Copy,
      action: () => {
        navigator.clipboard.writeText('amar@example.com');
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          onClose();
        }, 800);
      },
    },
    {
      label: 'View GitHub Profile',
      icon: ExternalLink,
      action: () => { window.open('https://github.com', '_blank'); onClose(); },
    },
  ];

  const filteredNav = navigationCommands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );
  const filteredActions = quickActionCommands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
              <Search className="w-5 h-5 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="w-full bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
              />
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded border border-neutral-200 dark:border-neutral-700">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-4">
              {filteredNav.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Navigation
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {filteredNav.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={item.action}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                        >
                          <Icon className="w-4 h-4 text-neutral-400 group-hover:text-indigo-500 transition-colors" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredActions.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Quick Actions
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {filteredActions.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={idx}
                          onClick={item.action}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                        >
                          <Icon className="w-4 h-4 text-neutral-400 group-hover:text-indigo-500 transition-colors" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredNav.length === 0 && filteredActions.length === 0 && (
                <div className="py-8 text-center text-sm text-neutral-400">
                  No commands matching "{query}"
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default CommandPalette;
