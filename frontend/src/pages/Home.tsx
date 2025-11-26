import React, { useState, useEffect } from "react";
import { Search, Bell, PlusCircle, Users, History, Menu, Filter, Star, Clock, MapPin } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/ui/SideBar";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";
import { cn } from "../utils/cn";
import { projectsApi, type Project, type ProjectFilters } from "../services/api/projects";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedBudget, setSelectedBudget] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load initial data
  useEffect(() => {
    loadProjects();
    loadCategories();
  }, []);

  // Load projects when filters change
  useEffect(() => {
    loadProjects();
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedBudget]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: ProjectFilters = {
        search: searchQuery || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== "all" ? selectedDifficulty : undefined,
        budget: selectedBudget !== "all" ? selectedBudget : undefined,
      };

      const response = await projectsApi.getProjects(filters);
      setProjects(response.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
      console.error("Error loading projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await projectsApi.getCategories();
      setCategories(["all", ...(response.data || [])]);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const handleJoinProject = async (projectId: string) => {
    try {
      await projectsApi.joinProject(projectId);
      setSuccessMessage("Join request sent successfully!");
      // Refresh projects to update applicant count
      loadProjects();
    } catch (err: any) {
      setError(err.message || "Failed to send join request");
    }
  };

  const difficulties = ["all", "beginner", "intermediate", "advanced"];
  const budgets = ["all", "unpaid", "paid", "equity", "negotiable"];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getBudgetColor = (budget: string) => {
    switch (budget) {
      case "paid":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "equity":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "negotiable":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "advanced":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="flex h-screen bg-brand-light-dark dark:bg-brand-dark">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />

      <div className="flex-1 overflow-hidden">
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 rounded-lg bg-green-100 p-4 text-green-700 shadow-lg dark:bg-green-900/20 dark:text-green-400">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed top-4 right-4 z-50 rounded-lg bg-red-100 p-4 text-red-700 shadow-lg dark:bg-red-900/20 dark:text-red-400">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              {error}
              <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
                ×
              </button>
            </div>
          </div>
        )}

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
              Explore
            </h1>
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
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
              onClick={() => navigate("/post-idea")}
            >
              Post an Idea
            </Button>
            <Button 
              size="sm" 
              className="sm:hidden"
              onClick={() => navigate("/post-idea")}
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
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-brand-dark dark:text-gray-100">
                  Difficulty:
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty === "all" ? "All Levels" : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-brand-dark dark:text-gray-100">
                  Budget:
                </label>
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                >
                  {budgets.map((budget) => (
                    <option key={budget} value={budget}>
                      {budget === "all" ? "All Budgets" : budget.charAt(0).toUpperCase() + budget.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedCategory !== "all" || selectedDifficulty !== "all" || selectedBudget !== "all" || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedDifficulty("all");
                    setSelectedBudget("all");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        <main className="h-[calc(100vh-4rem)] overflow-y-auto p-4 md:p-8 bg-brand-light-dark dark:bg-brand-dark">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100">
                Discover Projects
              </h2>
              <p className="text-brand-dark/60 dark:text-gray-300">
                {isLoading ? "Loading..." : `${projects.length} project${projects.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mb-4"></div>
                <p className="text-brand-dark dark:text-gray-100">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-700">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-brand-dark dark:text-gray-100">
                  No projects found
                </h3>
                <p className="mt-2 text-brand-dark/60 dark:text-gray-300">
                  Try adjusting your search or filters to find more projects.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => navigate("/post-idea")}
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                >
                  Post Your Idea
                </Button>
              </div>
            ) : (
              projects.map((project, index) => (
                <div
                  key={project.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 md:p-6 shadow-sm transition-all hover:border-brand-orange hover:shadow-md dark:border-gray-600 dark:bg-brand-dark-lighter dark:shadow-lg"
                >
                  <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-lg bg-gradient-to-br from-brand-orange to-brand-red flex-shrink-0 flex items-center justify-center text-white font-bold text-xl">
                      {project.title.charAt(0)}
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                              {project.title}
                            </h3>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {project.rating}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span>by {project.owner.username}</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(project.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {project.applicants} interested
                            </div>
                            {project.isRemote && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                Remote
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={cn("rounded-full px-2 py-1 text-xs font-medium", getDifficultyColor(project.difficulty))}>
                            {project.difficulty}
                          </span>
                          <span className={cn("rounded-full px-2 py-1 text-xs font-medium", getBudgetColor(project.budget))}>
                            {project.budget}
                          </span>
                        </div>
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {project.description}
                      </p>
                      
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Team Size: {project.teamSize.min}-{project.teamSize.max}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Duration: {project.duration}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.techStack.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-orange/20 dark:text-brand-orange"
                          >
                            {tech}
                          </span>
                        ))}
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {project.category}
                        </span>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <Button 
                          className="flex-1 sm:flex-none"
                          onClick={() => handleJoinProject(project.id)}
                        >
                          Join Project
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 sm:flex-none"
                          onClick={() => navigate(`/project/${project.id}`)}
                        >
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;