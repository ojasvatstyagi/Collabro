import React from 'react';
import { Search, Plus } from 'lucide-react';
import Button from '../ui/Button';
import TaskCard from './TaskCard';
import { Task } from '../../services/api/projects';

interface TasksTabProps {
  tasks: Task[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTaskStatus: string;
  setSelectedTaskStatus: (status: string) => void;
  onOpenCreateModal: () => void;
  onUpdateStatus: (taskId: string, newStatus: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  searchQuery,
  setSearchQuery,
  selectedTaskStatus,
  setSelectedTaskStatus,
  onOpenCreateModal,
  onUpdateStatus,
  onDeleteTask,
}) => {
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      selectedTaskStatus === 'all' || task.status === selectedTaskStatus;
    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="h-full">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-brand-dark placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
          <select
            value={selectedTaskStatus}
            onChange={(e) => setSelectedTaskStatus(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
          >
            <option value="all">All Tasks</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={onOpenCreateModal}
        >
          New Task
        </Button>
      </div>

      {filteredTasks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onUpdateStatus}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p>No tasks found. Create one to get started!</p>
        </div>
      )}
    </div>
  );
};

export default TasksTab;
