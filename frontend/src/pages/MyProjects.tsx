import React, { useState } from 'react';
import { Users, ChevronRight, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';

import { projectsApi, Project } from '../services/api/projects';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const navigate = useNavigate();
  // Backend uses uppercase status
  const isOngoing = project.status === 'ACTIVE';

  const handleProjectClick = () => {
    navigate(`/project/${project.id}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div
      onClick={handleProjectClick}
      className="group cursor-pointer rounded-xl bg-white p-6 shadow-sm border border-gray-200 transition-all hover:shadow-md hover:border-brand-orange/50 dark:bg-brand-dark-lighter dark:border-gray-600 dark:hover:border-brand-orange/50 dark:shadow-lg flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center text-white text-xl font-bold shadow-sm">
            {project.title.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-lg text-brand-dark dark:text-gray-100 line-clamp-1 group-hover:text-brand-orange transition-colors">
              {project.title}
            </h3>
            <span className="text-xs text-brand-dark/50 dark:text-gray-400">
              Created {formatDate(project.createdAt)}
            </span>
          </div>
        </div>
        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium border',
            isOngoing
              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40'
              : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
          )}
        >
          {isOngoing ? 'Active' : 'Completed'}
        </span>
      </div>

      <p className="text-sm text-brand-dark/70 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed flex-1">
        {project.description}
      </p>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {project.technologies?.slice(0, 3).map((tech, index) => (
            <span
              key={index}
              className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
            >
              {tech}
            </span>
          ))}
          {project.technologies && project.technologies.length > 3 && (
            <span className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 border border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
              +{project.technologies.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-brand-dark/60 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">
              {project.teamSize} Member{project.teamSize !== 1 && 's'}
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="text-brand-orange hover:text-brand-orange/90 p-0 hover:bg-transparent"
            rightIcon={<ChevronRight className="h-4 w-4" />}
          >
            {isOngoing ? 'Manage' : 'View Details'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProjectSection: React.FC<{
  title: string;
  projects: Project[];
  showAll?: boolean;
}> = ({ title, projects, showAll = false }) => (
  <div className="mb-12">
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-brand-dark dark:text-gray-100">
        {title}
      </h2>
      {showAll && (
        <button className="text-sm font-medium text-brand-orange hover:text-brand-red dark:text-brand-yellow dark:hover:text-brand-orange">
          see all
        </button>
      )}
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  </div>
);

const MyProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]); // Created by me
  const [joinedProjects, setJoinedProjects] = useState<Project[]>([]); // Joined
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsLoading(true);
      setError(null);
      const [userProjectsRes, joinedProjectsRes] = await Promise.all([
        projectsApi.getUserProjects(),
        projectsApi.getJoinedProjects(),
      ]);

      let allProjects: Project[] = [];
      if (userProjectsRes.success && userProjectsRes.data) {
        allProjects = [...allProjects, ...userProjectsRes.data];
      }
      if (joinedProjectsRes.success && joinedProjectsRes.data) {
        // Mark joined projects distinct if needed, but for now just merging or we can split state
        // Let's split state to be cleaner
      }

      // Actually let's use separate state for joined projects
      setProjects(userProjectsRes.data || []);
      setJoinedProjects(joinedProjectsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading projects');
    } finally {
      setIsLoading(false);
    }
  };

  const ongoingProjects = projects.filter((p) => p.status === 'ACTIVE');
  const pastProjects = projects.filter(
    (p) => p.status === 'COMPLETED' || p.status === 'CANCELLED'
  );

  return (
    <DashboardLayout
      title="Projects"
      showSearch={true}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchPlaceholder="Search..."
      actions={
        <div className="flex items-center gap-2">
          <Button
            leftIcon={<PlusCircle className="h-5 w-5" />}
            className="hidden sm:flex"
            onClick={() => navigate('/post-idea')}
          >
            Post an Idea
          </Button>
          <Button
            size="sm"
            className="sm:hidden"
            onClick={() => navigate('/post-idea')}
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="container mx-auto max-w-7xl px-4 py-8 bg-brand-light-dark dark:bg-brand-dark min-h-screen">
        <h1 className="mb-8 text-2xl md:text-3xl font-bold text-brand-dark dark:text-gray-100">
          Your Projects
        </h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-brand-orange"></div>
            <p className="mt-4 text-brand-dark/60 dark:text-gray-400">
              Loading your projects...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-brand-red">{error}</p>
            <Button onClick={loadProjects} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-brand-orange/10 p-6">
              <PlusCircle className="h-12 w-12 text-brand-orange" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-brand-dark dark:text-gray-100">
              You haven't posted any projects yet
            </h2>
            <p className="mt-2 text-brand-dark/60 dark:text-gray-400">
              Share your idea with the community and start building your dream
              team.
            </p>
            <Button
              className="mt-6"
              onClick={() => navigate('/post-idea')}
              leftIcon={<PlusCircle className="h-5 w-5" />}
            >
              Post Your First Idea
            </Button>
          </div>
        ) : (
          <>
            {ongoingProjects.length > 0 && (
              <ProjectSection
                title="Ongoing Projects"
                projects={ongoingProjects}
                showAll={ongoingProjects.length > 3}
              />
            )}

            {pastProjects.length > 0 && (
              <ProjectSection
                title="Standard/Completed Projects"
                projects={pastProjects}
                showAll={pastProjects.length > 3}
              />
            )}

            {joinedProjects.length > 0 && (
              <ProjectSection
                title="Joined Projects"
                projects={joinedProjects}
                showAll={joinedProjects.length > 3}
              />
            )}

            {ongoingProjects.length === 0 &&
              pastProjects.length === 0 &&
              joinedProjects.length === 0 && (
                <div className="py-10 text-center text-brand-dark/50 dark:text-gray-500">
                  <p>No projects found matching the current filters.</p>
                </div>
              )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyProjects;
