import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Sidebar } from './Sidebar';
import { Bell, Search, Settings, LogOut } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { avatarPlaceholder } from '@/lib/articlePlaceholder';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { currentUser, logout } = useAppState();
  const navigate = useNavigate();

  const avatarSrc = currentUser?.avatar || avatarPlaceholder(currentUser?.name ?? '');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-subl-grey-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 px-8 flex items-center justify-between bg-subl-grey-50">
          {title && <h1 className="text-lg font-semibold text-subl-grey-900">{title}</h1>}
          <div className="flex items-center gap-4 ml-auto">
            {/* Search — decorative until global search is implemented */}
            <div className="relative" aria-label="Search (coming soon)">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-subl-grey-400" size={16} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search"
                disabled
                aria-label="Search"
                className="pl-9 pr-4 py-2 rounded-xl bg-white border border-subl-grey-100 text-sm w-64 opacity-60 cursor-not-allowed"
              />
            </div>

            {/* Bell — decorative until notifications are implemented */}
            <button
              aria-label="Notifications (coming soon)"
              disabled
              className="relative p-2 rounded-xl bg-white border border-subl-grey-100 opacity-60 cursor-not-allowed"
            >
              <Bell size={18} className="text-subl-grey-600" aria-hidden="true" />
            </button>

            {/* Account dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="flex items-center gap-2.5 pl-2 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-subl-blue-200 pr-2 py-1"
                >
                  <img
                    src={avatarSrc}
                    alt={currentUser?.name ?? 'Account'}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-subl-blue-100"
                  />
                  <span className="text-sm font-medium text-subl-grey-800 max-w-[120px] truncate">
                    {currentUser?.name ?? 'Account'}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold text-subl-grey-900 truncate">
                    {currentUser?.name ?? 'Account'}
                  </p>
                  <p className="text-xs text-subl-grey-500 truncate mt-0.5">
                    {currentUser?.email ?? ''}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/settings')}
                  className="gap-2 cursor-pointer"
                >
                  <Settings size={15} />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut size={15} />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-8 pb-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
