import React from 'react';
import { Users, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  getStatusColor,
  getStatusIcon,
  getPriorityColor,
} from '../../utils/helper';
import { Task } from '../../services/api/projects';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onDelete,
}) => {
  const StatusIcon = getStatusIcon(task.status);

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 transition-all hover:shadow-md dark:bg-brand-dark-lighter dark:border-gray-600">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('h-4 w-4', getStatusColor(task.status))} />
          <h3 className="font-medium text-brand-dark dark:text-gray-100">
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-1 text-xs font-medium',
              getPriorityColor(task.priority)
            )}
          >
            {task.priority}
          </span>

          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Delete Task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-sm text-brand-dark/60 dark:text-gray-300 mb-3">
        {task.description}
      </p>

      <div className="flex flex-wrap gap-1 mb-3">
        {task.tags?.map((tag, index) => (
          <span
            key={index}
            className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-orange/20"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="text-xs rounded border border-gray-200 bg-gray-50 px-2 py-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-dark/60 dark:text-gray-300">
          {task.assigneeName && (
            <span
              title={`Assigned to ${task.assigneeName}`}
              className="flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              {task.assigneeName}
            </span>
          )}
          {task.dueDate && (
            <span title={`Due ${new Date(task.dueDate).toLocaleDateString()}`}>
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
