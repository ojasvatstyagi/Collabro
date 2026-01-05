import React, { useState, ReactNode } from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import Sidebar from '../ui/SideBar';
import ThemeToggle from '../ui/ThemeToggle';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  showSearch?: boolean;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode; // Custom buttons on the right
  showBell?: boolean; // Default true, can disable for generic pages
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  showSearch = false,
  searchQuery = '',
  setSearchQuery,
  searchPlaceholder = 'Search...',
  actions,
  showBell = true,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-brand-light-dark dark:bg-brand-dark">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 dark:border-gray-600 dark:bg-brand-dark-light">
          <div className="flex flex-1 items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-brand-dark-lighter"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:block dark:text-gray-400 dark:hover:bg-brand-dark-lighter"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-xl font-semibold text-brand-dark dark:text-gray-100 whitespace-nowrap">
              {title}
            </h1>

            {showSearch && setSearchQuery && (
              <div className="relative flex-1 max-w-2xl ml-4 hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-brand-dark placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4 ml-4 flex-shrink-0">
            {/* Mobile Search Icon (only if search is enabled but hidden) - optional improvement, 
                 but for now keeping simple to match existing UI which hid search on mobile sometimes? 
                 Actually existing UI just squeezed it. 
                 Let's keep the desktop search hidden on super small screens if needed, 
                 but the existing UI had it visible. 
                 The passed 'showSearch' renders the input. 
             */}

            {actions}

            <ThemeToggle />

            {showBell && (
              <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-brand-dark-lighter">
                <Bell className="h-5 w-5" />
              </button>
            )}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
