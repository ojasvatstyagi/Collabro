import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Compass,
  MessageSquare,
  FolderKanban,
  History,
  Award,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "../../utils/cn";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: "Explore", icon: Compass, href: "/explore" },
    { name: "Teams", icon: Users, href: "/teams" },
    { name: "Requests", icon: MessageSquare, href: "/requests" },
    { name: "My Projects", icon: FolderKanban, href: "/projects" },
    { name: "History", icon: History, href: "/history" },
    { name: "Achievements", icon: Award, href: "/achievements" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ];

  // Sign out handler
  const handleSignOut = () => {
    // TODO: Add your logout logic here if needed (e.g., clearing auth tokens)
    // Example: localStorage.removeItem('token');
    // Example: setUser(null);

    // Redirect to landing page
    navigate("/");
  };

  // Profile navigation handler
  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-brand-dark/10 bg-white dark:border-brand-light/10 dark:bg-brand-dark/80">
      <div className="flex h-16 items-center gap-2 border-b border-brand-dark/10 px-6 dark:border-brand-light/10">
        <Users className="h-6 w-6 text-brand-orange dark:text-brand-yellow" />
        <span className="text-lg font-semibold text-brand-dark dark:text-brand-light">
          PeerSpace
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-8">
          <div
            className="flex cursor-pointer items-center gap-3 rounded-lg bg-brand-light/30 p-3 transition hover:bg-brand-light/50 dark:bg-brand-dark dark:hover:bg-brand-dark/70"
            onClick={handleProfileClick}
            title="Go to Profile"
          >
            <div className="h-10 w-10 rounded-full bg-brand-orange/20" />
            <div>
              <div className="font-medium text-brand-dark dark:text-brand-light">
                username
              </div>
              <div className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                View Profile
              </div>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-orange/10 text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow"
                    : "text-brand-dark/60 hover:bg-brand-light/50 hover:text-brand-dark dark:text-brand-light/60 dark:hover:bg-brand-dark/50 dark:hover:text-brand-light"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-brand-dark/10 p-4 dark:border-brand-light/10">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-dark/60 transition-colors hover:bg-brand-light/50 hover:text-brand-dark dark:text-brand-light/60 dark:hover:bg-brand-dark/50 dark:hover:text-brand-light"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
