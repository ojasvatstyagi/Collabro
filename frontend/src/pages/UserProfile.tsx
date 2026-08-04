import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GraduationCap, MapPin, RefreshCw, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../services/api/profile';
import { projectsApi, type Project } from '../services/api/projects';
import type { PublicProfile } from '../services/api/teams';
import { cn } from '../utils/cn';
import { errorMessage } from '../utils/errors';
import { displayName, initials } from '../utils/people';

type LoadState = 'loading' | 'ready' | 'notFound' | 'error';

const STATUS_STYLES: Record<Project['status'], string> = {
  ACTIVE:
    'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40',
  COMPLETED:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40',
  CANCELLED:
    'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

const titleCase = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');

/** Another person's profile: what they chose to make public, and the projects they started. */
const UserProfile: React.FC = () => {
  const { username = '' } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const load = useCallback(async () => {
    setState('loading');
    setProfile(null);
    setProjects([]);
    try {
      const response = await profileApi.getPublicProfile(username);
      const loaded = response.data as PublicProfile;
      setProfile(loaded);
      const owned = await projectsApi.getUserProjects(loaded.id);
      setProjects(owned.data ?? []);
      setState('ready');
    } catch (err) {
      if ((err as { status?: number }).status === 404) {
        setState('notFound');
        return;
      }
      const text = errorMessage(err, 'Could not load this profile');
      setMessage(text);
      setState('error');
      toast.error(text);
    }
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  const isMe = user?.username === username;

  return (
    <DashboardLayout title={profile ? displayName(profile) : 'Profile'}>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {state === 'loading' && (
          <div
            className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-brand-dark-lighter"
            aria-label="Loading profile"
          />
        )}

        {state === 'notFound' && (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
            <div className="rounded-full bg-brand-orange/10 p-6">
              <UserX className="h-10 w-10 text-brand-orange" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-brand-dark dark:text-gray-100">
              No such user
            </h2>
            <p className="mt-1 text-sm text-brand-dark/60 dark:text-gray-400">
              There is no account called @{username}, or it has been deleted.
            </p>
            <Link to="/explore" className="mt-4 text-sm font-medium text-brand-orange hover:underline">
              Back to Explore
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-900/10">
            <p className="mb-4 text-red-700 dark:text-red-400">{message}</p>
            <Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>
              Retry
            </Button>
          </div>
        )}

        {state === 'ready' && profile && (
          <>
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-brand-dark-lighter">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                {profile.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    alt={displayName(profile)}
                    className="h-24 w-24 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange/15 text-3xl font-semibold text-brand-orange">
                    {initials(profile)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-brand-dark dark:text-white">
                    {displayName(profile)}
                  </h1>
                  <p className="text-sm text-brand-dark/60 dark:text-gray-400">@{profile.username}</p>

                  <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-brand-dark/70 dark:text-gray-300 sm:justify-start">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {profile.location}
                      </span>
                    )}
                    {profile.education && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" /> {profile.education}
                      </span>
                    )}
                  </div>

                  {profile.bio ? (
                    <p className="mt-4 whitespace-pre-line text-sm text-brand-dark/80 dark:text-gray-200">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm italic text-brand-dark/50 dark:text-gray-400">
                      {isMe ? 'You have not written a bio yet.' : 'No bio yet.'}
                    </p>
                  )}

                  {isMe && (
                    <Link to="/profile" className="mt-4 inline-block">
                      <Button size="sm" variant="outline">
                        Edit my profile
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-brand-dark dark:text-gray-100">Skills</h2>
              {profile.skills.length === 0 ? (
                <p className="text-sm text-brand-dark/50 dark:text-gray-400">No skills listed.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-brand-dark dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-200"
                    >
                      {skill.name}
                      <span className="ml-2 text-xs text-brand-dark/50 dark:text-gray-400">
                        {titleCase(skill.proficiency)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-brand-dark dark:text-gray-100">
                Projects ({projects.length})
              </h2>
              {projects.length === 0 ? (
                <p className="text-sm text-brand-dark/50 dark:text-gray-400">No projects yet.</p>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {projects.map((project) => (
                    <li
                      key={project.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-brand-dark-lighter"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-brand-dark dark:text-gray-100">{project.title}</h3>
                        <span
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-xs font-medium',
                            STATUS_STYLES[project.status]
                          )}
                        >
                          {titleCase(project.status)}
                        </span>
                      </div>
                      {project.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-brand-dark/70 dark:text-gray-300">
                          {project.description}
                        </p>
                      )}
                      {project.technologies?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {project.technologies.slice(0, 5).map((tech) => (
                            <span
                              key={tech}
                              className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;
