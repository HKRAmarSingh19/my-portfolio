import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FolderGit2,
  BookOpen,
  Layers,
  Mail,
  Plus,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Images,
} from 'lucide-react';
import { statsApi } from '../../api/client';
import SEO from '../../components/common/SEO';

export const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => statsApi.getStats(),
  });

  const stats = data?.data?.data || {};

  const metricCards = [
    {
      label: 'Total Projects',
      value: stats.projects?.total ?? 0,
      subtext: `${stats.projects?.featured ?? 0} featured`,
      icon: FolderGit2,
      href: '/admin/projects',
      color: 'text-indigo-400',
    },
    {
      label: 'Blog Posts',
      value: stats.blog?.total ?? 0,
      subtext: `${stats.blog?.published ?? 0} published`,
      icon: BookOpen,
      href: '/admin/blog',
      color: 'text-blue-400',
    },
    {
      label: 'Skills Listed',
      value: stats.skills?.total ?? 0,
      subtext: 'Categorized',
      icon: Layers,
      href: '/admin/skills',
      color: 'text-purple-400',
    },
    {
      label: 'Inquiries / Messages',
      value: stats.messages?.total ?? 0,
      subtext: `${stats.messages?.unread ?? 0} unread`,
      icon: Mail,
      href: '/admin/messages',
      color: 'text-amber-400',
    },
    {
      label: 'Gallery Images',
      value: stats.gallery?.total ?? 0,
      subtext: 'Visual archive',
      icon: Images,
      href: '/admin/gallery',
      color: 'text-rose-400',
    },
  ];

  return (
    <div className="space-y-8">
      <SEO title="Admin Dashboard" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">System Overview</span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
            Dashboard Overview
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/projects"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-mono border border-neutral-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Link>
          <Link
            to="/admin/blog"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-mono border border-neutral-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Post</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.href}
              className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all space-y-4 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl bg-neutral-950 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-sans font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {isLoading ? '...' : card.value}
                </div>
                <div className="text-xs font-mono text-neutral-500 mt-1">
                  {card.subtext}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-base text-white">Recent Inquiries</h3>
            <Link to="/admin/messages" className="text-xs font-mono text-indigo-400 hover:underline">
              View All
            </Link>
          </div>

          {stats.recentMessages?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`p-4 rounded-xl border ${
                    msg.read ? 'bg-neutral-950/40 border-neutral-800/60' : 'bg-neutral-950 border-indigo-500/30'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{msg.name}</span>
                    <span className="font-mono text-neutral-500 text-[11px]">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2">{msg.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-6 text-center">No incoming messages yet.</p>
          )}
        </div>

        <div className="lg:col-span-5 bg-neutral-900 rounded-2xl border border-neutral-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-base text-white">Recent Projects</h3>
            <Link to="/admin/projects" className="text-xs font-mono text-indigo-400 hover:underline">
              Manage
            </Link>
          </div>

          {stats.recentProjects?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentProjects.map((p) => (
                <div
                  key={p._id}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">{p.title}</h4>
                    <span className="text-[10px] font-mono text-indigo-400">{p.category}</span>
                  </div>
                  <Link
                    to={`/projects/${p.slug || p._id}`}
                    target="_blank"
                    className="p-1.5 text-neutral-400 hover:text-white"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-6 text-center">No projects created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
