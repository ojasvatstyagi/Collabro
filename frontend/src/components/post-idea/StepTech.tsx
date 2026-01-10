import React, { useState } from 'react';
import { AlertCircle, X, Plus } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';
import { ProjectIdeaState } from './types';
import { popularTechStack } from '../../utils/lists';

interface StepTechProps {
  data: ProjectIdeaState;
  onChange: (field: keyof ProjectIdeaState, value: any) => void;
  errors: Record<string, string>;
}

const StepTech: React.FC<StepTechProps> = ({ data, onChange, errors }) => {
  const [newTech, setNewTech] = useState('');

  const addTechStack = (tech: string) => {
    if (tech && !data.techStack.includes(tech)) {
      onChange('techStack', [...data.techStack, tech]);
    }
  };

  const removeTechStack = (tech: string) => {
    onChange(
      'techStack',
      data.techStack.filter((t) => t !== tech)
    );
  };

  const addCustomTech = () => {
    if (newTech.trim() && !data.techStack.includes(newTech.trim())) {
      addTechStack(newTech.trim());
      setNewTech('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100 mb-2">
          Technical Details
        </h2>
        <p className="text-brand-dark/60 dark:text-gray-300">
          What technologies will you use?
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
          Tech Stack <span className="text-brand-red">*</span>
        </label>

        {/* Selected Technologies */}
        {data.techStack.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {data.techStack.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center rounded-full bg-brand-orange/10 px-3 py-1 text-sm font-medium text-brand-orange dark:bg-brand-orange/20"
              >
                {tech}
                <button
                  onClick={() => removeTechStack(tech)}
                  className="ml-2 rounded-full p-1 hover:bg-brand-orange/20 dark:hover:bg-brand-orange/30"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Popular Technologies */}
        <div className="mb-4">
          <p className="text-sm text-brand-dark/60 dark:text-gray-300 mb-2">
            Popular technologies:
          </p>
          <div className="flex flex-wrap gap-2">
            {popularTechStack
              .filter((tech) => !data.techStack.includes(tech))
              .slice(0, 12)
              .map((tech) => (
                <button
                  key={tech}
                  onClick={() => addTechStack(tech)}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {tech}
                </button>
              ))}
          </div>
        </div>

        {/* Add Custom Technology */}
        <div className="flex gap-2">
          <Input
            label=""
            value={newTech}
            onChange={(e) => setNewTech(e.target.value)}
            placeholder="Add custom technology"
            onKeyPress={(e) => e.key === 'Enter' && addCustomTech()}
          />
          <Button
            onClick={addCustomTech}
            disabled={!newTech.trim()}
            className="mt-0"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add
          </Button>
        </div>

        {errors.techStack && (
          <div className="mt-1 flex items-center text-xs text-brand-red">
            <AlertCircle size={12} className="mr-1" />
            <span>{errors.techStack}</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
            Project Duration <span className="text-brand-red">*</span>
          </label>
          <select
            value={data.duration}
            onChange={(e) => onChange('duration', e.target.value)}
            className={cn(
              'w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all',
              'bg-white dark:bg-brand-dark-lighter',
              'text-brand-dark dark:text-gray-100',
              errors.duration
                ? 'border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/20'
                : 'border-gray-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600'
            )}
          >
            <option value="">Select duration</option>
            <option value="1-2 weeks">1-2 weeks</option>
            <option value="1 month">1 month</option>
            <option value="2-3 months">2-3 months</option>
            <option value="3-6 months">3-6 months</option>
            <option value="6+ months">6+ months</option>
            <option value="ongoing">Ongoing</option>
          </select>
          {errors.duration && (
            <div className="mt-1 flex items-center text-xs text-brand-red">
              <AlertCircle size={12} className="mr-1" />
              <span>{errors.duration}</span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
            Difficulty Level
          </label>
          <select
            value={data.difficulty}
            onChange={(e) => onChange('difficulty', e.target.value as any)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default StepTech;
