import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Users,
  CheckSquare,
  Plus,
  Search,
  Eye,
  Trash2,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { cn } from '../utils/cn';
import {
  getStatusColor,
  getStatusIcon,
  getPriorityColor,
} from '../utils/helper';
import {
  projectsApi,
  Project,
  Task,
  CreateTaskRequest,
} from '../services/api/projects';

const ProjectWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<any[]>([]); // Placeholder type for now

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    tags: [],
    dueDate: '',
    assigneeId: '',
  });
  const [newTaskTagInput, setNewTaskTagInput] = useState('');

  useEffect(() => {
    if (projectId) {
      loadProjectData(projectId);
    }
  }, [projectId]);

  const loadProjectData = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch Project, Tasks, and Team in parallel
      const [projectRes, tasksRes, teamRes] = await Promise.all([
        projectsApi.getProjectById(id),
        projectsApi.getProjectTasks(id),
        projectsApi.getProjectTeam(id), // Placeholder endpoint
      ]);

      if (projectRes.success && projectRes.data) {
        setProject(projectRes.data);
      } else {
        throw new Error(projectRes.message || 'Failed to load project');
      }

      if (tasksRes.success && tasksRes.data) {
        setTasks(tasksRes.data);
      }

      if (teamRes.success && teamRes.data) {
        setTeam(teamRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!projectId || !newTaskData.title) return;

    try {
      const payload: CreateTaskRequest = {
        ...newTaskData,
        tags: newTaskData.tags?.length ? newTaskData.tags : undefined,
        // Ensure priority is uppercase for backend
        priority: newTaskData.priority?.toUpperCase(),
      };

      const res = await projectsApi.createTask(projectId, payload);
      if (res.success && res.data) {
        setTasks([...tasks, res.data]);
        setIsTaskModalOpen(false);
        setNewTaskData({
          // Reset form
          title: '',
          description: '',
          priority: 'MEDIUM',
          tags: [],
          dueDate: '',
          assigneeId: '',
        });
      }
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await projectsApi.updateTask(taskId, {
        status: newStatus as any,
      });
      if (res.success && res.data) {
        setTasks(tasks.map((t) => (t.id === taskId ? res.data! : t)));
      }
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await projectsApi.deleteTask(taskId);
      if (res.success) {
        setTasks(tasks.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      selectedTaskStatus === 'all' || task.status === selectedTaskStatus;
    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
    const StatusIcon = getStatusIcon(task.status);

    return (
      <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200 transition-all hover:shadow-md dark:bg-brand-dark-lighter dark:border-gray-600">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon
              className={cn('h-4 w-4', getStatusColor(task.status))}
            />
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

            {/* Dropdown for Actions could go here, for now just a delete button */}
            <button
              onClick={() => handleDeleteTask(task.id)}
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
          {/* Assignee / Status Change */}
          <div className="flex items-center gap-2">
            <select
              value={task.status}
              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
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
              <span
                title={`Due ${new Date(task.dueDate).toLocaleDateString()}`}
              >
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    // Simple Loading State
    return (
      <DashboardLayout title="Loading Project...">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout title="Error">
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            Failed to load project
          </h2>
          <p className="text-gray-600 mb-4">{error || 'Project not found'}</p>
          <Button
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/projects')}
          >
            Back to Projects
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={project.title}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/projects')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
      }
    >
      <div className="flex flex-col min-h-[calc(100vh-64px)]">
        {/* Floating Top Navigation */}
        <div className="sticky top-4 z-20 mx-auto mt-4 w-full max-w-5xl px-4">
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-lg ring-1 ring-gray-200 dark:bg-brand-dark/80 dark:ring-gray-700">
            <nav className="flex items-center gap-8 px-6 overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                { id: 'files', label: 'Files', icon: FileText },
                { id: 'chat', label: 'Chat', icon: MessageSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'relative flex items-center gap-2 py-4 text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'text-brand-orange'
                      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-brand-light-dark dark:bg-brand-dark p-4 md:p-8">
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Overview Card */}
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

              {/* Sidebar Information */}
              <div className="space-y-6">
                {/* Team Card (Placeholder mainly until team API is full) */}
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-brand-dark dark:text-gray-100">
                      Team Members
                    </h2>
                    {/* <Button size="sm" variant="ghost" leftIcon={<Plus className="h-4 w-4"/>}>Invite</Button> */}
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
                            {/* Role if available */}
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
          )}

          {activeTab === 'tasks' && (
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
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  New Task
                </Button>
              </div>

              {filteredTasks.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <p>No tasks found. Create one to get started!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Create New Task"
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            value={newTaskData.title}
            onChange={(e) =>
              setNewTaskData({ ...newTaskData, title: e.target.value })
            }
            placeholder="e.g. Implement Login Page"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:bg-brand-dark-lighter dark:border-gray-600 dark:text-white"
              rows={3}
              value={newTaskData.description || ''}
              onChange={(e) =>
                setNewTaskData({ ...newTaskData, description: e.target.value })
              }
              placeholder="Describe the task..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:bg-brand-dark-lighter dark:border-gray-600 dark:text-white"
                value={newTaskData.priority || 'MEDIUM'}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, priority: e.target.value })
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:bg-brand-dark-lighter dark:border-gray-600 dark:text-white"
                value={newTaskData.dueDate || ''}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Input
              label="Tags"
              value={newTaskTagInput}
              onChange={(e) => {
                setNewTaskTagInput(e.target.value);
                setNewTaskData({
                  ...newTaskData,
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                });
              }}
              placeholder="frontend, ui, bug"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTaskData.title}>
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
