import React, { useState } from "react";
import {
  Clock,
  Users,
  FolderKanban,
  MessageSquare,
  Award,
  GitBranch,
  Calendar,
  Filter,
  Search,
  Bell,
  Menu,
  ChevronDown,
  ExternalLink,
  Star,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  FileText,
  Settings,
} from "lucide-react";
import Sidebar from "../components/ui/SideBar";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";
import { cn } from "../utils/cn";

interface HistoryItem {
  id: string;
  type: "project" | "collaboration" | "achievement" | "request" | "system";
  title: string;
  description: string;
  timestamp: string;
  status?: "completed" | "ongoing" | "pending" | "cancelled";
  participants?: string[];
  projectName?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  metadata?: {
    duration?: string;
    teamSize?: number;
    technologies?: string[];
    rating?: number;
  };
}

const mockHistoryData: HistoryItem[] = [
  {
    id: "1",
    type: "project",
    title: "Completed E-commerce Platform",
    description: "Successfully delivered a full-stack e-commerce solution with real-time inventory management",
    timestamp: "2024-01-15T10:30:00Z",
    status: "completed",
    participants: ["sarah_dev", "mike_frontend", "alex_backend"],
    projectName: "Modern E-commerce Platform",
    icon: CheckCircle2,
    color: "text-green-500",
    metadata: {
      duration: "3 months",
      teamSize: 4,
      technologies: ["React", "Node.js", "PostgreSQL"],
      rating: 4.8,
    },
  },
  {
    id: "2",
    type: "collaboration",
    title: "Joined AI Analytics Team",
    description: "Started collaboration on AI-powered analytics dashboard project",
    timestamp: "2024-01-10T14:20:00Z",
    status: "ongoing",
    participants: ["data_scientist_emma", "ml_engineer_raj"],
    projectName: "AI Analytics Dashboard",
    icon: UserPlus,
    color: "text-blue-500",
    metadata: {
      teamSize: 5,
      technologies: ["Python", "TensorFlow", "React"],
    },
  },
  {
    id: "3",
    type: "achievement",
    title: "Earned Team Player Badge",
    description: "Recognized for outstanding collaboration across multiple projects",
    timestamp: "2024-01-08T09:15:00Z",
    status: "completed",
    icon: Award,
    color: "text-yellow-500",
  },
  {
    id: "4",
    type: "request",
    title: "Project Request Approved",
    description: "Your request to join Mobile Fitness App project was approved",
    timestamp: "2024-01-05T16:45:00Z",
    status: "completed",
    participants: ["fitness_dev_lisa"],
    projectName: "Mobile Fitness App",
    icon: MessageSquare,
    color: "text-green-500",
    metadata: {
      teamSize: 3,
      technologies: ["React Native", "Firebase"],
    },
  },
  {
    id: "5",
    type: "project",
    title: "Started Project Management System",
    description: "Initiated development of collaborative project management platform",
    timestamp: "2024-01-03T11:00:00Z",
    status: "ongoing",
    participants: ["pm_david", "ux_designer_anna"],
    projectName: "Project Management System",
    icon: FolderKanban,
    color: "text-blue-500",
    metadata: {
      teamSize: 6,
      technologies: ["Vue.js", "Express", "MongoDB"],
    },
  },
  {
    id: "6",
    type: "system",
    title: "Profile Updated",
    description: "Updated skills and education information",
    timestamp: "2024-01-01T08:30:00Z",
    status: "completed",
    icon: Settings,
    color: "text-gray-500",
  },
  {
    id: "7",
    type: "collaboration",
    title: "Left Chat Application Team",
    description: "Completed contribution to real-time chat application project",
    timestamp: "2023-12-28T13:20:00Z",
    status: "completed",
    participants: ["chat_dev_tom", "ui_specialist_jane"],
    projectName: "Real-time Chat Application",
    icon: Users,
    color: "text-gray-500",
    metadata: {
      duration: "2 months",
      teamSize: 3,
      technologies: ["React", "Socket.io", "WebRTC"],
      rating: 4.6,
    },
  },
  {
    id: "8",
    type: "request",
    title: "Request Declined",
    description: "Your request to join Blockchain Wallet project was declined",
    timestamp: "2023-12-25T10:15:00Z",
    status: "cancelled",
    projectName: "Blockchain Wallet",
    icon: AlertCircle,
    color: "text-red-500",
  },
];

const filterOptions = [
  { value: "all", label: "All Activities" },
  { value: "project", label: "Projects" },
  { value: "collaboration", label: "Collaborations" },
  { value: "achievement", label: "Achievements" },
  { value: "request", label: "Requests" },
  { value: "system", label: "System" },
];

const timeRangeOptions = [
  { value: "all", label: "All Time" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

const HistoryCard: React.FC<{ item: HistoryItem }> = ({ item }) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusConfig = {
      completed: { color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400", label: "Completed" },
      ongoing: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", label: "Ongoing" },
      pending: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400", label: "Pending" },
      cancelled: { color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400", label: "Cancelled" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <span className={cn("rounded-full px-2 py-1 text-xs font-medium", config.color)}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="group rounded-lg bg-white p-4 md:p-6 shadow-sm border border-gray-200 transition-all hover:shadow-md dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700", item.color)}>
          <item.icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-brand-dark dark:text-gray-100">
                  {item.title}
                </h3>
                {getStatusBadge(item.status)}
              </div>
              <p className="text-sm text-brand-dark/60 dark:text-gray-300 mb-2">
                {item.description}
              </p>
              
              {/* Project name */}
              {item.projectName && (
                <div className="flex items-center gap-1 mb-2">
                  <FolderKanban className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-brand-orange dark:text-brand-orange">
                    {item.projectName}
                  </span>
                </div>
              )}

              {/* Participants */}
              {item.participants && item.participants.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div className="flex flex-wrap gap-1">
                    {item.participants.slice(0, 3).map((participant, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-300"
                      >
                        {participant}
                      </span>
                    ))}
                    {item.participants.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{item.participants.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {item.metadata && (
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {item.metadata.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.metadata.duration}
                    </div>
                  )}
                  {item.metadata.teamSize && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {item.metadata.teamSize} members
                    </div>
                  )}
                  {item.metadata.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {item.metadata.rating}
                    </div>
                  )}
                </div>
              )}

              {/* Technologies */}
              {item.metadata?.technologies && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.metadata.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="text-xs bg-brand-orange/10 text-brand-orange px-2 py-1 rounded dark:bg-brand-orange/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Timestamp and Actions */}
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(item.timestamp)}
              </span>
              {item.projectName && (
                <Button
                  variant="outline"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  rightIcon={<ExternalLink className="h-3 w-3" />}
                >
                  View
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const History: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter history data
  const filteredHistory = mockHistoryData.filter((item) => {
    const matchesFilter = selectedFilter === "all" || item.type === selectedFilter;
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Time range filtering would be implemented here
    return matchesFilter && matchesSearch;
  });

  // Group by date
  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  const formatGroupDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
    }
  };

  return (
    <div className="flex h-screen bg-brand-light-dark dark:bg-brand-dark">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 dark:border-gray-600 dark:bg-brand-dark-light">
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

            <h1 className="text-xl font-semibold text-brand-dark dark:text-gray-100">
              History
            </h1>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-brand-dark placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="h-4 w-4" />}
              rightIcon={<ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />}
              className="hidden sm:flex"
            >
              Filters
            </Button>

            <ThemeToggle />
            <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-brand-dark-lighter">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-brand-dark-light">
            <div className="flex flex-wrap gap-4">
              {/* Activity Type Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-brand-dark dark:text-gray-100">
                  Type:
                </label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Range Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-brand-dark dark:text-gray-100">
                  Time:
                </label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                >
                  {timeRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(selectedFilter !== "all" || selectedTimeRange !== "all" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFilter("all");
                    setSelectedTimeRange("all");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto max-w-4xl px-4 py-8 bg-brand-light-dark dark:bg-brand-dark">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-dark dark:text-gray-100">
              Activity History
            </h1>
            <div className="text-sm text-brand-dark/60 dark:text-gray-300">
              {filteredHistory.length} {filteredHistory.length === 1 ? 'activity' : 'activities'}
            </div>
          </div>

          {/* History Timeline */}
          {Object.keys(groupedHistory).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-brand-dark dark:text-gray-100 mb-2">
                No activities found
              </h3>
              <p className="text-brand-dark/60 dark:text-gray-300">
                {searchQuery || selectedFilter !== "all" 
                  ? "Try adjusting your filters or search terms"
                  : "Your activity history will appear here as you use the platform"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedHistory)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, items]) => (
                  <div key={date} className="space-y-4">
                    {/* Date Header */}
                    <div className="flex items-center gap-4">
                      <h2 className="text-lg font-semibold text-brand-dark dark:text-gray-100">
                        {formatGroupDate(date)}
                      </h2>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
                      <span className="text-sm text-brand-dark/60 dark:text-gray-300">
                        {items.length} {items.length === 1 ? 'activity' : 'activities'}
                      </span>
                    </div>

                    {/* Activities */}
                    <div className="space-y-4">
                      {items
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((item) => (
                          <HistoryCard key={item.id} item={item} />
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;