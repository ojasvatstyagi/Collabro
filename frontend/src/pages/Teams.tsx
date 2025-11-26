import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Bell,
  PlusCircle,
  Menu,
  Filter,
  Star,
  Clock,
  MapPin,
  ChevronRight,
  UserPlus,
  Settings,
  Crown,
  Shield,
  Eye,
  MessageSquare,
  Calendar,
  Award,
  TrendingUp,
  Globe,
  Lock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/SideBar";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";
import { cn } from "../utils/cn";

interface TeamMember {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  profilePictureUrl: string;
  role: "owner" | "admin" | "member";
  status: "online" | "away" | "offline";
  joinedAt: string;
  skills: string[];
  contribution: number; // percentage
}

interface Team {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  visibility: "public" | "private" | "invite-only";
  memberCount: number;
  maxMembers: number;
  members: TeamMember[];
  owner: TeamMember;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  rating: number;
  projectsCompleted: number;
  currentProjects: number;
  achievements: string[];
  location?: string;
  isRemote: boolean;
  requirements: string[];
  benefits: string[];
  applicationStatus?: "none" | "pending" | "approved" | "rejected";
}

// Mock data
const mockTeams: Team[] = [
  {
    id: "1",
    name: "Frontend Innovators",
    description: "A team of passionate frontend developers focused on creating cutting-edge user interfaces and experiences using modern technologies.",
    category: "Web Development",
    tags: ["React", "TypeScript", "UI/UX", "Modern Web"],
    visibility: "public",
    memberCount: 8,
    maxMembers: 12,
    members: [
      {
        id: "1",
        username: "sarah_ui",
        firstname: "Sarah",
        lastname: "Johnson",
        profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
        role: "owner",
        status: "online",
        joinedAt: "2024-01-01T00:00:00Z",
        skills: ["React", "TypeScript", "Figma"],
        contribution: 95,
      },
      {
        id: "2",
        username: "mike_react",
        firstname: "Mike",
        lastname: "Chen",
        profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
        role: "admin",
        status: "online",
        joinedAt: "2024-01-05T00:00:00Z",
        skills: ["React", "Next.js", "CSS"],
        contribution: 88,
      },
    ],
    owner: {
      id: "1",
      username: "sarah_ui",
      firstname: "Sarah",
      lastname: "Johnson",
      profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
      role: "owner",
      status: "online",
      joinedAt: "2024-01-01T00:00:00Z",
      skills: ["React", "TypeScript", "Figma"],
      contribution: 95,
    },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
    isActive: true,
    rating: 4.8,
    projectsCompleted: 12,
    currentProjects: 3,
    achievements: ["Top Performer", "Innovation Award"],
    isRemote: true,
    requirements: ["2+ years React experience", "Strong CSS skills", "Team player"],
    benefits: ["Flexible hours", "Learning opportunities", "Mentorship"],
    applicationStatus: "none",
  },
  {
    id: "2",
    name: "AI Research Collective",
    description: "Cutting-edge AI research team working on machine learning models and data science projects with real-world applications.",
    category: "AI/Machine Learning",
    tags: ["Python", "TensorFlow", "Research", "Data Science"],
    visibility: "invite-only",
    memberCount: 6,
    maxMembers: 10,
    members: [
      {
        id: "3",
        username: "dr_ai",
        firstname: "Emma",
        lastname: "Wilson",
        profilePictureUrl: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=150",
        role: "owner",
        status: "away",
        joinedAt: "2024-01-10T00:00:00Z",
        skills: ["Python", "TensorFlow", "Research"],
        contribution: 92,
      },
    ],
    owner: {
      id: "3",
      username: "dr_ai",
      firstname: "Emma",
      lastname: "Wilson",
      profilePictureUrl: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=150",
      role: "owner",
      status: "away",
      joinedAt: "2024-01-10T00:00:00Z",
      skills: ["Python", "TensorFlow", "Research"],
      contribution: 92,
    },
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-22T00:00:00Z",
    isActive: true,
    rating: 4.9,
    projectsCompleted: 8,
    currentProjects: 2,
    achievements: ["Research Excellence", "Innovation Leader"],
    isRemote: true,
    requirements: ["PhD in AI/ML or equivalent", "Published research", "Python expertise"],
    benefits: ["Research funding", "Conference attendance", "Publication opportunities"],
    applicationStatus: "pending",
  },
  {
    id: "3",
    name: "Mobile Masters",
    description: "Expert mobile development team specializing in cross-platform applications using React Native and Flutter.",
    category: "Mobile Development",
    tags: ["React Native", "Flutter", "iOS", "Android"],
    visibility: "public",
    memberCount: 5,
    maxMembers: 8,
    members: [
      {
        id: "4",
        username: "mobile_guru",
        firstname: "Alex",
        lastname: "Rodriguez",
        profilePictureUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
        role: "owner",
        status: "offline",
        joinedAt: "2024-01-15T00:00:00Z",
        skills: ["React Native", "Flutter", "iOS"],
        contribution: 90,
      },
    ],
    owner: {
      id: "4",
      username: "mobile_guru",
      firstname: "Alex",
      lastname: "Rodriguez",
      profilePictureUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
      role: "owner",
      status: "offline",
      joinedAt: "2024-01-15T00:00:00Z",
      skills: ["React Native", "Flutter", "iOS"],
      contribution: 90,
    },
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-21T00:00:00Z",
    isActive: true,
    rating: 4.6,
    projectsCompleted: 15,
    currentProjects: 4,
    achievements: ["Mobile Excellence", "Cross-platform Expert"],
    location: "San Francisco, CA",
    isRemote: false,
    requirements: ["Mobile development experience", "React Native or Flutter", "App Store experience"],
    benefits: ["Competitive salary", "Stock options", "Health benefits"],
    applicationStatus: "approved",
  },
];

const categories = [
  "All Teams",
  "Web Development",
  "Mobile Development",
  "AI/Machine Learning",
  "Data Science",
  "Backend Development",
  "DevOps",
  "UI/UX Design",
  "Game Development",
  "Blockchain",
  "Cybersecurity",
];

const TeamCard: React.FC<{ team: Team; onJoinTeam: (teamId: string) => void }> = ({ team, onJoinTeam }) => {
  const getVisibilityIcon = () => {
    switch (team.visibility) {
      case "public":
        return <Globe className="h-4 w-4 text-green-500" />;
      case "private":
        return <Lock className="h-4 w-4 text-red-500" />;
      case "invite-only":
        return <Shield className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getApplicationStatusBadge = () => {
    switch (team.applicationStatus) {
      case "pending":
        return (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="mr-1 h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const canJoin = team.visibility === "public" && team.applicationStatus === "none" && team.memberCount < team.maxMembers;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 transition-all hover:shadow-md dark:bg-brand-dark-lighter dark:border-gray-600">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-brand-dark dark:text-gray-100">
              {team.name}
            </h3>
            {getVisibilityIcon()}
            {team.isActive && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-brand-dark/60 dark:text-gray-300 mb-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{team.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{team.memberCount}/{team.maxMembers} members</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>{team.projectsCompleted} completed</span>
            </div>
            {team.location && !team.isRemote && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{team.location}</span>
              </div>
            )}
            {team.isRemote && (
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span>Remote</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getApplicationStatusBadge()}
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-brand-dark/80 dark:text-gray-200 mb-4">
        {team.description}
      </p>

      {/* Owner */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={team.owner.profilePictureUrl}
          alt={team.owner.username}
          className="h-8 w-8 rounded-full"
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-brand-dark dark:text-gray-100">
              {team.owner.firstname} {team.owner.lastname}
            </span>
            <Crown className="h-4 w-4 text-yellow-500" />
          </div>
          <span className="text-xs text-brand-dark/60 dark:text-gray-300">
            Team Owner
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-orange/20">
          {team.category}
        </span>
        {team.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            {tag}
          </span>
        ))}
        {team.tags.length > 3 && (
          <span className="text-xs text-brand-dark/60 dark:text-gray-300">
            +{team.tags.length - 3} more
          </span>
        )}
      </div>

      {/* Achievements */}
      {team.achievements.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {team.achievements.map((achievement, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
            >
              <Award className="mr-1 h-3 w-3" />
              {achievement}
            </span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg dark:bg-gray-700/50">
        <div className="text-center">
          <div className="text-lg font-semibold text-brand-dark dark:text-gray-100">
            {team.projectsCompleted}
          </div>
          <div className="text-xs text-brand-dark/60 dark:text-gray-300">
            Completed
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-brand-dark dark:text-gray-100">
            {team.currentProjects}
          </div>
          <div className="text-xs text-brand-dark/60 dark:text-gray-300">
            Active
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-brand-dark dark:text-gray-100">
            {team.rating}
          </div>
          <div className="text-xs text-brand-dark/60 dark:text-gray-300">
            Rating
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {canJoin ? (
          <Button
            className="flex-1"
            onClick={() => onJoinTeam(team.id)}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Join Team
          </Button>
        ) : team.applicationStatus === "approved" ? (
          <Button
            className="flex-1"
            leftIcon={<MessageSquare className="h-4 w-4" />}
          >
            View Team
          </Button>
        ) : team.visibility === "invite-only" ? (
          <Button
            variant="outline"
            className="flex-1"
            disabled
          >
            Invite Only
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex-1"
            disabled
          >
            Team Full
          </Button>
        )}
        <Button
          variant="outline"
          leftIcon={<Eye className="h-4 w-4" />}
        >
          View Details
        </Button>
      </div>
    </div>
  );
};

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Teams");
  const [selectedVisibility, setSelectedVisibility] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [successMessage, setSuccessMessage] = useState("");

  const handleJoinTeam = async (teamId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update team application status
      setTeams(prevTeams =>
        prevTeams.map(team =>
          team.id === teamId
            ? { ...team, applicationStatus: "pending" as const }
            : team
        )
      );
      
      setSuccessMessage("Application sent successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error joining team:", error);
    }
  };

  const filteredTeams = teams.filter((team) => {
    const matchesSearch = searchQuery === "" || 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All Teams" || team.category === selectedCategory;
    
    const matchesVisibility = selectedVisibility === "all" || team.visibility === selectedVisibility;

    return matchesSearch && matchesCategory && matchesVisibility;
  });

  return (
    <div className="flex h-screen bg-brand-light-dark dark:bg-brand-dark">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />

      <div className="flex-1 overflow-hidden">
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 rounded-lg bg-green-100 p-4 text-green-700 shadow-lg dark:bg-green-900/20 dark:text-green-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
            </div>
          </div>
        )}

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

            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Teams
            </h1>
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<Filter className="h-4 w-4" />}
              className="hidden sm:flex"
            >
              Filters
            </Button>
            <ThemeToggle />
            <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-brand-dark-lighter">
              <Bell className="h-5 w-5" />
            </button>
            <Button 
              leftIcon={<PlusCircle className="h-5 w-5" />} 
              className="hidden sm:flex"
              onClick={() => navigate("/create-team")}
            >
              Create Team
            </Button>
            <Button 
              size="sm" 
              className="sm:hidden"
              onClick={() => navigate("/create-team")}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-brand-dark-light">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-brand-dark dark:text-gray-100">
                  Category:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-brand-dark dark:text-gray-100">
                  Visibility:
                </label>
                <select
                  value={selectedVisibility}
                  onChange={(e) => setSelectedVisibility(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                >
                  <option value="all">All Teams</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="invite-only">Invite Only</option>
                </select>
              </div>

              {(selectedCategory !== "All Teams" || selectedVisibility !== "all" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("All Teams");
                    setSelectedVisibility("all");
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
        <main className="h-[calc(100vh-4rem)] overflow-y-auto p-4 md:p-8 bg-brand-light-dark dark:bg-brand-dark">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100">
                Discover Teams
              </h2>
              <p className="text-brand-dark/60 dark:text-gray-300">
                {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-brand-orange/10 p-2">
                  <Users className="h-5 w-5 text-brand-orange" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-brand-dark dark:text-gray-100">
                    {teams.length}
                  </div>
                  <div className="text-sm text-brand-dark/60 dark:text-gray-300">
                    Total Teams
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-brand-dark dark:text-gray-100">
                    {teams.filter(t => t.isActive).length}
                  </div>
                  <div className="text-sm text-brand-dark/60 dark:text-gray-300">
                    Active Teams
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-brand-dark dark:text-gray-100">
                    {teams.filter(t => t.visibility === 'public').length}
                  </div>
                  <div className="text-sm text-brand-dark/60 dark:text-gray-300">
                    Public Teams
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/20">
                  <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-brand-dark dark:text-gray-100">
                    {teams.reduce((sum, team) => sum + team.projectsCompleted, 0)}
                  </div>
                  <div className="text-sm text-brand-dark/60 dark:text-gray-300">
                    Projects Done
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Teams Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredTeams.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-700">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-brand-dark dark:text-gray-100">
                  No teams found
                </h3>
                <p className="mt-2 text-brand-dark/60 dark:text-gray-300">
                  Try adjusting your search or filters to find more teams.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => navigate("/create-team")}
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                >
                  Create Your Team
                </Button>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onJoinTeam={handleJoinTeam}
                />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Teams;