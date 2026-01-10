import React from 'react';
import { ProjectIdeaState } from './types';

interface ProjectPreviewProps {
  data: ProjectIdeaState;
}

const ProjectPreview: React.FC<ProjectPreviewProps> = ({ data }) => {
  return (
    <div className="mt-8 rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
      <h3 className="text-lg font-semibold text-brand-dark dark:text-gray-100 mb-4">
        Preview
      </h3>
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-brand-dark dark:text-gray-100">
            {data.title}
          </h4>
          <p className="text-sm text-brand-dark/60 dark:text-gray-300 mt-1">
            {data.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-orange/20">
            {data.category}
          </span>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {data.teamSize.min}-{data.teamSize.max} members
          </span>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {data.duration}
          </span>
          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {data.difficulty}
          </span>
        </div>

        {data.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.techStack.slice(0, 5).map((tech) => (
              <span
                key={tech}
                className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              >
                {tech}
              </span>
            ))}
            {data.techStack.length > 5 && (
              <span className="text-xs text-brand-dark/60 dark:text-gray-300">
                +{data.techStack.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPreview;
