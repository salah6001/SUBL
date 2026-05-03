import { useLocation, useNavigate } from 'react-router';
import { SublLogo } from './SublLogo';
import { useAppState } from '@/hooks/useAppState';
import {
  LayoutDashboard,
  Newspaper,
  Sparkles,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/articles', label: 'Articles', icon: Newspaper },
  { path: '/subl-ai', label: 'Subl AI', icon: Sparkles },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAppState();

  return (
    <aside className="w-[260px] min-h-screen bg-white border-r border-subl-grey-100 flex flex-col sticky top-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <SublLogo className="w-8 h-8" />
        <span className="text-xl font-bold text-subl-blue-500">Subl</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-subl-blue-50 text-subl-blue-500'
                  : 'text-subl-grey-600 hover:bg-subl-grey-50 hover:text-subl-grey-800'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 mt-auto">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          aria-label="Log out"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-subl-grey-600 hover:bg-subl-grey-50 hover:text-subl-grey-800 transition-all duration-200"
        >
          <LogOut size={20} strokeWidth={2} />
          Log out
        </button>
      </div>
    </aside>
  );
}
