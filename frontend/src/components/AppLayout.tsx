import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Bell, Search } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { currentUser } = useAppState();

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
            <div className="flex items-center gap-3 pl-2">
              <div className="w-9 h-9 rounded-full bg-subl-blue-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-subl-blue-500">
                  {currentUser?.name?.[0]?.toUpperCase() ?? 'U'}
                </span>
              </div>
            </div>
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
