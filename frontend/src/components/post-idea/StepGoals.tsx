import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ProjectIdeaState } from './types';

interface StepGoalsProps {
  data: ProjectIdeaState;
  onChange: (field: keyof ProjectIdeaState, value: any) => void;
  errors: Record<string, string>;
}

const StepGoals: React.FC<StepGoalsProps> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100 mb-2">
          Goals & Contact
        </h2>
        <p className="text-brand-dark/60 dark:text-gray-300">
          Final details and how to reach you
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
          Preferred Contact Method
        </label>
        <select
          value={data.contactMethod}
          onChange={(e) => onChange('contactMethod', e.target.value as any)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
        >
          <option value="platform">Through Platform</option>
          <option value="email">Email</option>
          <option value="discord">Discord</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
          Additional Information
        </label>
        <textarea
          value={data.additionalInfo}
          onChange={(e) => onChange('additionalInfo', e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100 dark:placeholder-gray-500 resize-none"
          rows={4}
          placeholder="Any additional details, links to mockups, or specific requirements..."
        />
      </div>

      {errors.submit && (
        <div className="flex items-center rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="mr-2 h-4 w-4" />
          {errors.submit}
        </div>
      )}
    </div>
  );
};

export default StepGoals;
