import React, { useState, useEffect } from "react";
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
  Menu,
  X,
  UserCheck,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  const navigation = [
    { name: "Explore", icon: Compass, href: "/explore" },
    { name: "Teams", icon: UserCheck, href: "/teams" },
    { name: "Requests", icon: MessageSquare, href: "/requests" },
    { name: "My Projects", icon: FolderKanban, href: "/projects" },
    { name: "History", icon: History, href: "/history" },
    { name: "Achievements", icon: Award, href: "/achievements" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ];

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsCollapsed]);

  // Sign out handler
  const handleSignOut = () => {
    navigate("/");
  };

  // Profile navigation handler
  const handleProfileClick = () => {
    navigate("/profile");
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  // Handle navigation click on mobile
  const handleNavClick = () => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-600 dark:bg-brand-dark-light md:relative md:z-auto",
          isCollapsed ? "w-16 md:w-16" : "w-64",
          isMobile && isCollapsed && "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-600">
          <div
            className={cn(
              "flex items-center gap-2",
              isCollapsed && "justify-center"
            )}
          >
            <Users className="h-6 w-6 text-brand-orange flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Collabro
              </span>
            )}
          </div>

          {/* Toggle button - only show on mobile when expanded */}
          {isMobile && !isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="rounded-lg p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Profile Section */}
          <div className="mb-8">
            <div
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg bg-gray-50 p-3 transition hover:bg-gray-100 dark:bg-brand-dark-lighter dark:hover:bg-gray-700",
                isCollapsed && "justify-center"
              )}
              onClick={handleProfileClick}
              title="Go to Profile"
            >
              {user?.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={user.username}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange font-bold">
                  {user?.firstname?.[0] || user?.username?.[0] || "U"}
                </div>
              )}
              {!isCollapsed && (
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : user?.username || "Guest"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    View Profile
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-orange/10 text-brand-orange"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 dark:border-gray-600">
          <button
            onClick={handleSignOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
