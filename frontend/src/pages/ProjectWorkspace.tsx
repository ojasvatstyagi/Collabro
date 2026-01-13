import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  Eye,
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
  projectsApi,
  Project,
  Task,
  CreateTaskRequest,
} from '../services/api/projects';

// Import extracted components
import OverviewTab from '../components/workspace/OverviewTab';
import TasksTab from '../components/workspace/TasksTab';
import FilesTab from '../components/workspace/FilesTab';
import ChatTab from '../components/workspace/ChatTab';

const ProjectWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<any[]>([]); // Placeholder type for now

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'tasks' | 'files' | 'chat'
  >('overview');
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
          Back to Projects
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
            <OverviewTab project={project} team={team} />
          )}

          {activeTab === 'tasks' && (
            <TasksTab
              tasks={tasks}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedTaskStatus={selectedTaskStatus}
              setSelectedTaskStatus={setSelectedTaskStatus}
              onOpenCreateModal={() => setIsTaskModalOpen(true)}
              onUpdateStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'files' && <FilesTab />}

          {activeTab === 'chat' && <ChatTab />}
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
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignee
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:bg-brand-dark-lighter dark:border-gray-600 dark:text-white"
                value={newTaskData.assigneeId || ''}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, assigneeId: e.target.value })
                }
              >
                <option value="">Unassigned</option>
                {team.map((member: any) => (
                  <option key={member.id} value={member.id}>
                    {member.firstname} {member.lastname} ({member.username})
                  </option>
                ))}
              </select>
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
