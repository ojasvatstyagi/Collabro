import React, { useState, useEffect } from 'react';
import {
  Search,
  PlusCircle,
  Users,
  History,
  Filter,
  Clock,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';
import {
  projectsApi,
  type Project,
  type ProjectFilters,
} from '../services/api/projects';

const Explore: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedTechnology, setSelectedTechnology] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt,desc');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load initial data
  useEffect(() => {
    loadProjects();
  }, []);

  // Load projects when filters or page change
  useEffect(() => {
    loadProjects();
  }, [
    searchQuery,
    selectedLevel,
    selectedTechnology,
    selectedCategory,
    sortBy,
    page,
  ]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: ProjectFilters = {
        search: searchQuery || undefined,
        level: selectedLevel !== 'all' ? selectedLevel : undefined,
        technology:
          selectedTechnology !== 'all' ? selectedTechnology : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sort: sortBy,
        page: page,
        limit: 9, // Projects per page
      };

      const response = await projectsApi.getProjects(filters);
      if (response.success && response.data) {
        setProjects(response.data.content);
        setTotalPages(response.data.totalPages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinProject = async (projectId: string) => {
    try {
      await projectsApi.joinProject(projectId);
      setSuccessMessage('Join request sent successfully!');
      // Refresh projects to update applicant count
      loadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to send join request');
    }
  };

  // You might want to fetch these from backend or define a static list
  const commonTechnologies = [
    'all',
    'React',
    'Spring Boot',
    'Java',
    'Python',
    'Node.js',
    'TypeScript',
    'Docker',
    'AWS',
  ];

  const categories = [
    'all',
    'Technology',
    'Design',
    'Marketing',
    'Business',
    'Finance',
    'Education',
    'Health',
    'Other',
  ];

  const levels = ['all', 'BRAND_NEW', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'ADVANCED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <DashboardLayout
      title="Explore"
      showSearch={true}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchPlaceholder="Search projects..."
      actions={
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
            className="hidden md:flex"
          >
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            leftIcon={<PlusCircle className="h-5 w-5" />}
            className="hidden md:flex"
            onClick={() => navigate('/post-idea')}
          >
            Post an Idea
          </Button>
          <Button
            size="sm"
            className="md:hidden"
            onClick={() => navigate('/post-idea')}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="bg-brand-light-dark p-4 md:p-8 dark:bg-brand-dark min-h-screen">
        <div className="mx-auto max-w-7xl">
          {/* Success Message */}
          {successMessage && (
            <div className="fixed top-4 right-4 z-50 rounded-lg bg-green-100 p-4 text-green-700 shadow-lg dark:bg-green-900 dark:text-green-100">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></div>
                {successMessage}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="fixed top-4 right-4 z-50 rounded-lg bg-red-100 p-4 text-red-700 shadow-lg dark:bg-red-900 dark:text-red-100">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-400 dark:bg-red-400"></div>
                {error}
                <button
                  onClick={() => setError(null)}
                  className="ml-2 text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-red-100"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-brand-dark-light">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-brand-dark dark:text-gray-100">
                    Level:
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                  >
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level === 'all'
                          ? 'All Levels'
                          : level.charAt(0).toUpperCase() +
                            level.slice(1).toLowerCase().replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-brand-dark dark:text-gray-100">
                    Tech:
                  </label>
                  <select
                    value={selectedTechnology}
                    onChange={(e) => setSelectedTechnology(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                  >
                    {commonTechnologies.map((tech) => (
                      <option key={tech} value={tech}>
                        {tech === 'all' ? 'All Tech' : tech}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-brand-dark dark:text-gray-100">
                      Category:
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === 'all' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-brand-dark dark:text-gray-100">
                      Sort:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                    >
                      <option value="createdAt,desc">Newest First</option>
                      <option value="createdAt,asc">Oldest First</option>
                      <option value="title,asc">A-Z</option>
                      <option value="title,desc">Z-A</option>
                    </select>
                  </div>

                  {(selectedLevel !== 'all' ||
                    searchQuery ||
                    selectedTechnology !== 'all' ||
                    selectedCategory !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLevel('all');
                        setSearchQuery('');
                        setSelectedTechnology('all');
                        setSelectedCategory('all');
                        setSortBy('createdAt,desc');
                        setPage(0);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100">
                Discover Projects
              </h2>
              <p className="text-brand-dark/60 dark:text-gray-300">
                {isLoading
                  ? 'Loading...'
                  : `${projects.length} project${
                      projects.length !== 1 ? 's' : ''
                    } available`}
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mb-4"></div>
                <p className="text-brand-dark dark:text-gray-100">
                  Loading projects...
                </p>
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
                  onClick={() => navigate('/post-idea')}
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                >
                  Post Your Idea
                </Button>
              </div>
            ) : (
              projects.map((project) => (
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
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span>
                              by {project.createdBy?.username || 'Unknown'}
                            </span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(project.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={cn(
                              'rounded-full px-2 py-1 text-xs font-medium',
                              getLevelColor(project.level)
                            )}
                          >
                            {project.level}
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
                            Team Size: {project.teamSize}
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
                        {project.technologies?.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-orange/20 dark:text-brand-orange"
                          >
                            {tech}
                          </span>
                        ))}
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
                          onClick={() => {
                            if (project.createdBy?.email) {
                              window.location.href = `mailto:${project.createdBy.email}?subject=Project Interest: ${project.title}`;
                            } else {
                              navigate(`/project/${project.id}`);
                            }
                          }}
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

          {/* Pagination Controls */}
          {!isLoading && projects.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-300">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Explore;
