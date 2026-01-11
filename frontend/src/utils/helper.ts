import { Circle, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'text-gray-500';
    case 'IN_PROGRESS':
      return 'text-blue-500';
    case 'REVIEW':
      return 'text-yellow-500';
    case 'COMPLETED':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return Circle;
    case 'IN_PROGRESS':
      return Clock;
    case 'REVIEW':
      return AlertCircle;
    case 'COMPLETED':
      return CheckCircle2;
    default:
      return Circle;
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'LOW':
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'HIGH':
      return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    case 'CRITICAL':
      return 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

export const getLevelColor = (level: string) => {
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

export const themeColors = [
  { name: 'Orange', value: 'orange', color: '#FFAC34' },
  { name: 'Blue', value: 'blue', color: '#3B82F6' },
  { name: 'Purple', value: 'purple', color: '#A855F7' },
  { name: 'Green', value: 'green', color: '#22C55E' },
] as const;

export const formatDate = (dateString: string) => {
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
