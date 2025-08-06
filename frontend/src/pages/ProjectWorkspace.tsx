import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  FileText,
  CheckSquare,
  Calendar,
  Settings,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Upload,
  Download,
  Share2,
  Bell,
  Video,
  Phone,
  Send,
  Paperclip,
  Smile,
  Menu,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  User,
  Eye,
  Edit3,
  Trash2,
  Star,
  Flag,
  Archive,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/ui/SideBar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import { cn } from "../utils/cn";

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: "online" | "away" | "offline";
  lastSeen?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  assignee: TeamMember;
  dueDate: string;
  createdAt: string;
  tags: string[];
  comments: number;
  attachments: number;
}

interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: TeamMember;
  uploadedAt: string;
  url: string;
  isShared: boolean;
}

interface ChatMessage {
  id: string;
  sender: TeamMember;
  content: string;
  timestamp: string;
  type: "text" | "file" | "system";
  reactions?: { emoji: string; users: string[] }[];
}

const mockProject = {
  id: "1",
  name: "Modern E-commerce Platform",
  description: "A full-stack e-commerce solution with real-time inventory management",
  status: "ongoing",
  progress: 65,
  startDate: "2024-01-15",
  endDate: "2024-04-15",
  techStack: ["React", "Node.js", "PostgreSQL", "Redis"],
};

const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    role: "Project Lead",
    status: "online",
  },
  {
    id: "2",
    name: "Mike Chen",
    avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
    role: "Frontend Developer",
    status: "online",
  },
  {
    id: "3",
    name: "Alex Rodriguez",
    avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
    role: "Backend Developer",
    status: "away",
    lastSeen: "2 hours ago",
  },
  {
    id: "4",
    name: "Emma Wilson",
    avatar: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=150",
    role: "UI/UX Designer",
    status: "offline",
    lastSeen: "Yesterday",
  },
];

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Design user authentication flow",
    description: "Create wireframes and mockups for login, register, and password reset flows",
    status: "done",
    priority: "high",
    assignee: mockTeamMembers[3],
    dueDate: "2024-01-20",
    createdAt: "2024-01-15",
    tags: ["UI/UX", "Authentication"],
    comments: 5,
    attachments: 3,
  },
  {
    id: "2",
    title: "Implement user authentication API",
    description: "Build JWT-based authentication system with refresh tokens",
    status: "in-progress",
    priority: "high",
    assignee: mockTeamMembers[2],
    dueDate: "2024-01-25",
    createdAt: "2024-01-16",
    tags: ["Backend", "API", "Security"],
    comments: 8,
    attachments: 1,
  },
  {
    id: "3",
    title: "Create product catalog component",
    description: "Build reusable product grid and list components with filtering",
    status: "review",
    priority: "medium",
    assignee: mockTeamMembers[1],
    dueDate: "2024-01-28",
    createdAt: "2024-01-18",
    tags: ["Frontend", "Components"],
    comments: 3,
    attachments: 0,
  },
  {
    id: "4",
    title: "Set up CI/CD pipeline",
    description: "Configure automated testing and deployment pipeline",
    status: "todo",
    priority: "medium",
    assignee: mockTeamMembers[0],
    dueDate: "2024-02-01",
    createdAt: "2024-01-20",
    tags: ["DevOps", "Infrastructure"],
    comments: 1,
    attachments: 0,
  },
];

const mockFiles: ProjectFile[] = [
  {
    id: "1",
    name: "Project Requirements.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadedBy: mockTeamMembers[0],
    uploadedAt: "2024-01-15",
    url: "#",
    isShared: true,
  },
  {
    id: "2",
    name: "UI Mockups.fig",
    type: "figma",
    size: "15.7 MB",
    uploadedBy: mockTeamMembers[3],
    uploadedAt: "2024-01-18",
    url: "#",
    isShared: true,
  },
  {
    id: "3",
    name: "Database Schema.sql",
    type: "sql",
    size: "45 KB",
    uploadedBy: mockTeamMembers[2],
    uploadedAt: "2024-01-20",
    url: "#",
    isShared: false,
  },
];

const mockChatMessages: ChatMessage[] = [
  {
    id: "1",
    sender: mockTeamMembers[0],
    content: "Good morning team! Let's have a quick standup in 10 minutes.",
    timestamp: "2024-01-22T09:00:00Z",
    type: "text",
  },
  {
    id: "2",
    sender: mockTeamMembers[1],
    content: "Sounds good! I've finished the product catalog component and it's ready for review.",
    timestamp: "2024-01-22T09:02:00Z",
    type: "text",
    reactions: [{ emoji: "👍", users: ["2", "3"] }],
  },
  {
    id: "3",
    sender: mockTeamMembers[2],
    content: "Great work Mike! I'm still working on the authentication API, should be done by EOD.",
    timestamp: "2024-01-22T09:05:00Z",
    type: "text",
  },
  {
    id: "4",
    sender: mockTeamMembers[3],
    content: "I've uploaded the latest UI mockups to the files section. Please take a look!",
    timestamp: "2024-01-22T09:10:00Z",
    type: "text",
  },
];

const ProjectWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "files" | "chat">("overview");
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string>("all");
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return "text-gray-500";
      case "in-progress":
        return "text-blue-500";
      case "review":
        return "text-yellow-500";
      case "done":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return Circle;
      case "in-progress":
        return Clock;
      case "review":
        return AlertCircle;
      case "done":
        return CheckCircle2;
      default:
        return Circle;
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const filteredTasks = mockTasks.filter((task) => {
    const matchesStatus = selectedTaskStatus === "all" || task.status === selectedTaskStatus;
    const matchesSearch = searchQuery === "" || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message via WebSocket or API
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const StatusIcon = getStatusIcon(task.status);
    
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 transition-all hover:shadow-md dark:bg-brand-dark-lighter dark:border-gray-600">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("h-4 w-4", getStatusColor(task.status))} />
            <h3 className="font-medium text-brand-dark dark:text-gray-100">{task.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-1 text-xs font-medium", getPriorityColor(task.priority))}>
              {task.priority}
            </span>
            <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        <p className="text-sm text-brand-dark/60 dark:text-gray-300 mb-3">{task.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-orange/20"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={task.assignee.avatar}
              alt={task.assignee.name}
              className="h-6 w-6 rounded-full"
            />
            <span className="text-xs text-brand-dark/60 dark:text-gray-300">
              {task.assignee.name}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-brand-dark/60 dark:text-gray-300">
            {task.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.comments}
              </div>
            )}
            {task.attachments > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {task.attachments}
              </div>
            )}
            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const FileCard: React.FC<{ file: ProjectFile }> = ({ file }) => {
    const getFileIcon = (type: string) => {
      switch (type) {
        case "pdf":
          return "📄";
        case "figma":
          return "🎨";
        case "sql":
          return "🗃️";
        default:
          return "📁";
      }
    };

    return (
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 transition-all hover:shadow-md dark:bg-brand-dark-lighter dark:border-gray-600">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFileIcon(file.type)}</span>
            <div>
              <h3 className="font-medium text-brand-dark dark:text-gray-100">{file.name}</h3>
              <p className="text-xs text-brand-dark/60 dark:text-gray-300">{file.size}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {file.isShared && <Share2 className="h-4 w-4 text-brand-orange" />}
            <button className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={file.uploadedBy.avatar}
              alt={file.uploadedBy.name}
              className="h-5 w-5 rounded-full"
            />
            <span className="text-xs text-brand-dark/60 dark:text-gray-300">
              {file.uploadedBy.name}
            </span>
          </div>
          <span className="text-xs text-brand-dark/60 dark:text-gray-300">
            {new Date(file.uploadedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" className="flex-1">
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
        </div>
      </div>
    );
  };

  const ChatMessage: React.FC<{ message: ChatMessage }> = ({ message }) => {
    return (
      <div className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <img
          src={message.sender.avatar}
          alt={message.sender.name}
          className="h-8 w-8 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-brand-dark dark:text-gray-100">
              {message.sender.name}
            </span>
            <span className="text-xs text-brand-dark/60 dark:text-gray-300">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          <p className="text-sm text-brand-dark/80 dark:text-gray-200">{message.content}</p>
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.users.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-brand-light-dark dark:bg-brand-dark">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />

      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 dark:border-gray-600 dark:bg-brand-dark-light">
          <div className="flex items-center gap-4">
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/projects")}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Projects
            </Button>

            <div>
              <h1 className="text-xl font-semibold text-brand-dark dark:text-gray-100">
                {mockProject.name}
              </h1>
              <p className="text-sm text-brand-dark/60 dark:text-gray-300">
                {mockProject.progress}% Complete
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Team Members */}
            <div className="flex -space-x-2">
              {mockTeamMembers.slice(0, 4).map((member) => (
                <div key={member.id} className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-8 w-8 rounded-full border-2 border-white dark:border-brand-dark-light"
                  />
                  <div
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-brand-dark-light",
                      member.status === "online" && "bg-green-500",
                      member.status === "away" && "bg-yellow-500",
                      member.status === "offline" && "bg-gray-400"
                    )}
                  />
                </div>
              ))}
            </div>

            <Button size="sm" leftIcon={<Video className="h-4 w-4" />}>
              Meet
            </Button>
            <ThemeToggle />
            <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-brand-dark-lighter">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 bg-white dark:border-gray-600 dark:bg-brand-dark-light">
          <nav className="flex space-x-8 px-4 md:px-8">
            {[
              { id: "overview", label: "Overview", icon: Eye },
              { id: "tasks", label: "Tasks", icon: CheckSquare },
              { id: "files", label: "Files", icon: FileText },
              { id: "chat", label: "Chat", icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-brand-orange text-brand-orange"
                    : "border-transparent text-brand-dark/60 hover:border-gray-300 hover:text-brand-dark dark:text-gray-300 dark:hover:text-gray-100"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-brand-light-dark dark:bg-brand-dark">
          {activeTab === "overview" && (
            <div className="p-4 md:p-8">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Project Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600">
                    <h2 className="text-lg font-semibold text-brand-dark dark:text-gray-100 mb-4">
                      Project Overview
                    </h2>
                    <p className="text-brand-dark/80 dark:text-gray-200 mb-4">
                      {mockProject.description}
                    </p>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-brand-dark/60 dark:text-gray-300">
                          Start Date
                        </label>
                        <p className="text-brand-dark dark:text-gray-100">
                          {new Date(mockProject.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-brand-dark/60 dark:text-gray-300">
                          End Date
                        </label>
                        <p className="text-brand-dark dark:text-gray-100">
                          {new Date(mockProject.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-medium text-brand-dark/60 dark:text-gray-300">
                        Progress
                      </label>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                          <div
                            className="h-2 bg-brand-orange rounded-full transition-all"
                            style={{ width: `${mockProject.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-brand-dark dark:text-gray-100">
                          {mockProject.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-medium text-brand-dark/60 dark:text-gray-300">
                        Tech Stack
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {mockProject.techStack.map((tech, index) => (
                          <span
                            key={index}
                            className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-orange/20"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600">
                    <h2 className="text-lg font-semibold text-brand-dark dark:text-gray-100 mb-4">
                      Recent Activity
                    </h2>
                    <div className="space-y-3">
                      {mockChatMessages.slice(-3).map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <img
                            src={message.sender.avatar}
                            alt={message.sender.name}
                            className="h-8 w-8 rounded-full flex-shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-brand-dark dark:text-gray-100">
                                {message.sender.name}
                              </span>
                              <span className="text-xs text-brand-dark/60 dark:text-gray-300">
                                {formatTimestamp(message.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-brand-dark/80 dark:text-gray-200">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team Sidebar */}
                <div className="space-y-6">
                  <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-brand-dark dark:text-gray-100">
                        Team Members
                      </h2>
                      <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                        Invite
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {mockTeamMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-10 w-10 rounded-full"
                            />
                            <div
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-brand-dark-lighter",
                                member.status === "online" && "bg-green-500",
                                member.status === "away" && "bg-yellow-500",
                                member.status === "offline" && "bg-gray-400"
                              )}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-brand-dark dark:text-gray-100">
                              {member.name}
                            </p>
                            <p className="text-xs text-brand-dark/60 dark:text-gray-300">
                              {member.role}
                            </p>
                          </div>
                          {member.status === "offline" && member.lastSeen && (
                            <span className="text-xs text-brand-dark/60 dark:text-gray-300">
                              {member.lastSeen}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="p-4 md:p-8">
              <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-brand-dark placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100 dark:placeholder-gray-500"
                    />
                  </div>
                  <select
                    value={selectedTaskStatus}
                    onChange={(e) => setSelectedTaskStatus(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                  >
                    <option value="all">All Tasks</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  New Task
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="p-4 md:p-8">
              <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    className="w-full sm:w-64 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-brand-dark placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>
                <Button leftIcon={<Upload className="h-4 w-4" />}>
                  Upload File
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {mockChatMessages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-brand-dark-light">
                <div className="flex gap-3">
                  <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type a message..."
                      className="w-full rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm text-brand-dark placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100 dark:placeholder-gray-500"
                    />
                  </div>
                  <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                    <Smile className="h-5 w-5" />
                  </button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    leftIcon={<Send className="h-4 w-4" />}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectWorkspace;