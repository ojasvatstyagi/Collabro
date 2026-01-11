import React from 'react';
import { Users } from 'lucide-react';
import { Project } from '../../services/api/projects';

interface OverviewTabProps {
  project: Project;
  team: any[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({ project, team }) => {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600">
          <h2 className="text-lg font-semibold text-brand-dark dark:text-gray-100 mb-4">
            Project Overview
          </h2>
          <p className="text-brand-dark/80 dark:text-gray-200 mb-6 whitespace-pre-wrap">
            {project.description}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-brand-dark/60 dark:text-gray-300">
                Level
              </label>
              <p className="font-medium text-brand-dark dark:text-gray-100 capitalize">
                {project.level.toLowerCase()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-brand-dark/60 dark:text-gray-300">
                Category
              </label>
              <p className="font-medium text-brand-dark dark:text-gray-100">
                {project.category}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-brand-dark/60 dark:text-gray-300">
              Technology Stack
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.technologies.map((tech, i) => (
                <span
                  key={i}
                  className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-orange/20"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-dark dark:text-gray-100">
              Team Members
            </h2>
          </div>

          {team.length > 0 ? (
            <div className="space-y-3">
              {team.map((member: any, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    {member.profilePictureUrl ? (
                      <img
                        src={member.profilePictureUrl}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-brand-dark dark:text-gray-100">
                      {member.firstname} {member.lastname}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No team members yet.
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                {project.createdBy.profilePictureUrl ? (
                  <img
                    src={project.createdBy.profilePictureUrl}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <Users className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-brand-dark dark:text-gray-100">
                  {project.createdBy.username}
                </p>
                <p className="text-xs text-gray-500">Owner</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
