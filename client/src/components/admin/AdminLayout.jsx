import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  BookOpen,
  Layers,
  Briefcase,
  Mail,
  LogOut,
  ExternalLink,
  ShieldCheck,
  UserCircle,
  Menu,
  X,
  Images,
  Instagram,
  Linkedin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const adminNavItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Profile & Portrait', href: '/admin/profile', icon: UserCircle },
  { name: 'Projects', href: '/admin/projects', icon: FolderGit2 },
  { name: 'Blog Posts', href: '/admin/blog', icon: BookOpen },
  { name: 'Skills', href: '/admin/skills', icon: Layers },
  { name: 'Gallery', href: '/admin/gallery', icon: Images },
  { name: 'Instagram', href: '/admin/instagram', icon: Instagram },
  { name: 'LinkedIn', href: '/admin/linkedin', icon: Linkedin },
  { name: 'Experience / Resume', href: '/admin/experience', icon: Briefcase },
  { name: 'Messages', href: '/admin/messages', icon: Mail },
];

export const AdminLayout = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white font-mono text-sm">
        Authenticating admin session...
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900">
        <div className="flex items-center gap-2 font-sans font-bold text-white">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span>Admin Portal</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-neutral-400 hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-neutral-900/95 md:bg-neutral-900 border-r border-neutral-800 flex flex-col justify-between p-5 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-sm text-white">Editorial Admin</h2>
              <p className="text-[11px] font-mono text-neutral-400">{user?.email || 'admin'}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);

              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 pt-6 border-t border-neutral-800">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs font-mono text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800/40 transition-colors"
          >
            <span>Live Portfolio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
export default AdminLayout;
