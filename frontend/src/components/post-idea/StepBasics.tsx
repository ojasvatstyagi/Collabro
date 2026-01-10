import React from 'react';
import { AlertCircle } from 'lucide-react';
import Input from '../ui/Input';
import { cn } from '../../utils/cn';
import { ProjectIdeaState } from './types';

interface StepBasicsProps {
  data: ProjectIdeaState;
  onChange: (field: keyof ProjectIdeaState, value: any) => void;
  errors: Record<string, string>;
}

const StepBasics: React.FC<StepBasicsProps> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100 mb-2">
          Project Basics
        </h2>
        <p className="text-brand-dark/60 dark:text-gray-300">
          Tell us about your project idea
        </p>
      </div>

      <Input
        label="Project Title"
        value={data.title}
        onChange={(e) => onChange('title', e.target.value)}
        error={errors.title}
        placeholder="e.g., AI-Powered Task Management App"
        required
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
          Project Description <span className="text-brand-red">*</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          className={cn(
            'w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all resize-none',
            'bg-white dark:bg-brand-dark-lighter',
            'text-brand-dark dark:text-gray-100',
            errors.description
              ? 'border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/20'
              : 'border-gray-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600'
          )}
          rows={6}
          placeholder="Describe your project idea, its purpose, and what you want to achieve..."
        />
        {errors.description && (
          <div className="mt-1 flex items-center text-xs text-brand-red">
            <AlertCircle size={12} className="mr-1" />
            <span>{errors.description}</span>
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
          Category <span className="text-brand-red">*</span>
        </label>
        <select
          value={data.category}
          onChange={(e) => onChange('category', e.target.value)}
          className={cn(
            'w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all',
            'bg-white dark:bg-brand-dark-lighter',
            'text-brand-dark dark:text-gray-100',
            errors.category
              ? 'border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/20'
              : 'border-gray-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600'
          )}
        >
          <option value="">Select a category</option>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Full Stack">Full Stack</option>
        </select>
        {errors.category && (
          <div className="mt-1 flex items-center text-xs text-brand-red">
            <AlertCircle size={12} className="mr-1" />
            <span>{errors.category}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepBasics;
