import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ProjectIdeaState } from './types';

interface StepTeamProps {
  data: ProjectIdeaState;
  onChange: (field: keyof ProjectIdeaState, value: any) => void;
  errors: Record<string, string>;
}

const StepTeam: React.FC<StepTeamProps> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100 mb-2">
          Team & Collaboration
        </h2>
        <p className="text-brand-dark/60 dark:text-gray-300">
          Define your team requirements
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
            Team Size
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={data.teamSize.max}
            onChange={(e) =>
              onChange('teamSize', {
                min: 1,
                max: parseInt(e.target.value) || 1,
              })
            }
            className={cn(
              'w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all',
              'bg-white dark:bg-brand-dark-lighter',
              'text-brand-dark dark:text-gray-100',
              errors.teamSizeMax
                ? 'border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/20'
                : 'border-gray-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600'
            )}
          />
          {errors.teamSizeMax && (
            <div className="mt-1 flex items-center text-xs text-brand-red">
              <AlertCircle size={12} className="mr-1" />
              <span>{errors.teamSizeMax}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
            Budget/Compensation
          </label>
          <select
            value={data.budget}
            onChange={(e) => onChange('budget', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
          >
            <option value="unpaid">Unpaid/Volunteer</option>
            <option value="equity">Equity/Revenue Share</option>
            <option value="paid">Paid Project</option>
            <option value="negotiable">Negotiable</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
            Work Style
          </label>
          <select
            value={data.isRemote ? 'remote' : 'in-person'}
            onChange={(e) => onChange('isRemote', e.target.value === 'remote')}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
          >
            <option value="remote">Remote</option>
            <option value="in-person">In-Person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.isOpenSource}
            onChange={(e) => onChange('isOpenSource', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
          />
          <span className="text-sm text-brand-dark dark:text-gray-100">
            Open Source Project
          </span>
        </label>
      </div>
    </div>
  );
};

export default StepTeam;
