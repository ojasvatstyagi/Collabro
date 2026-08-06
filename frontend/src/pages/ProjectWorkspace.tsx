import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  Eye,
  FileText,
  LogOut,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
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

// Import Edit Modals
import EditProjectModal from '../components/workspace/EditProjectModal';
import EditTaskModal from '../components/workspace/EditTaskModal';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils/errors';
import type { PublicProfile } from '../services/api/teams';
import { assigneeOptions } from '../utils/people';

type WorkspaceTab = 'overview' | 'tasks' | 'files' | 'chat';

const WORKSPACE_TABS: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
];

const ProjectWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<PublicProfile[]>([]);
  // The server's team list leaves the owner out; they can be given tasks too
  const assignees = assigneeOptions(project?.createdBy, team);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingProjectAction, setPendingProjectAction] = useState<
    'delete' | 'leave' | null
  >(null);
  const [isProjectActionRunning, setIsProjectActionRunning] = useState(false);

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
        projectsApi.getProjectTeam(id),
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
    } catch (err) {
      setError(errorMessage(err, 'An error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleEditProject = () => {
    setIsEditProjectModalOpen(true);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!projectId) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await projectsApi.removeTeamMember(projectId, memberId);
      setTeam((prev) => prev.filter((m) => m.id !== memberId));
      toast.success('Member removed');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not remove the member'));
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditTaskModalOpen(true);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

  const handleCreateTask = async () => {
    if (!projectId) return;
    if (!newTaskData.title.trim()) {
      toast.error('Give the task a title');
      return;
    }

    try {
      const payload: CreateTaskRequest = {
        ...newTaskData,
        tags: newTaskData.tags?.length ? newTaskData.tags : undefined,
        // Ensure priority is uppercase for backend
        priority: newTaskData.priority?.toUpperCase(),
      };

      const res = await projectsApi.createTask(projectId, payload);
      if (res.data) {
        setTasks((prev) => [...prev, res.data!]);
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
      // The modal stays open with what was typed
      toast.error(errorMessage(err, 'Could not create the task'));
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await projectsApi.updateTask(taskId, {
        status: newStatus as Task['status'],
      });
      if (res.data) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? res.data! : t)));
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the task'));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await projectsApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the task'));
    }
  };

  // Owners delete the project; everyone else leaves its team. Both end on the projects list.
  const handleProjectAction = async () => {
    if (!projectId || !pendingProjectAction) return;
    setIsProjectActionRunning(true);
    try {
      if (pendingProjectAction === 'delete') {
        await projectsApi.deleteProject(projectId);
        toast.success('Project deleted');
      } else {
        await projectsApi.leaveProject(projectId);
        toast.success('You left the project');
      }
      navigate('/projects', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, 'That did not work'));
      setIsProjectActionRunning(false);
      setPendingProjectAction(null);
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

  // project.createdBy.id is a profile id while the logged-in user's id is a user id, so they
  // cannot be compared; usernames are unique, so compare those. This only decides which
  // controls are shown: the backend enforces ownership on every owner-only action.
  const isOwner = !!user && project.createdBy.username === user.username;

  return (
    <DashboardLayout
      title={project.title}
      actions={
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800"
              onClick={() => setPendingProjectAction('delete')}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Delete project
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingProjectAction('leave')}
              leftIcon={<LogOut className="h-4 w-4" />}
            >
              Leave project
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/projects')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Projects
          </Button>
        </div>
      }
    >
      <div className="flex flex-col min-h-[calc(100vh-64px)]">
        {/* Floating Top Navigation */}
        <div className="sticky top-4 z-20 mx-auto mt-4 w-full max-w-5xl px-4">
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-lg ring-1 ring-gray-200 dark:bg-brand-dark/80 dark:ring-gray-700">
            <nav className="flex items-center gap-8 px-6 overflow-x-auto no-scrollbar">
              {WORKSPACE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
            <OverviewTab
              project={project}
              team={team}
              isOwner={isOwner}
              onEditProject={handleEditProject}
              onRemoveMember={handleRemoveMember}
            />
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
              onEditTask={handleEditTask}
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
                {assignees.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
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

      {/* Edit Project Modal */}
      {project && (
        <EditProjectModal
          isOpen={isEditProjectModalOpen}
          onClose={() => setIsEditProjectModalOpen(false)}
          project={project}
          onUpdate={handleProjectUpdate}
        />
      )}

      {/* Delete / leave confirmation */}
      <Modal
        isOpen={pendingProjectAction !== null}
        onClose={() => !isProjectActionRunning && setPendingProjectAction(null)}
        title={
          pendingProjectAction === 'delete' ? 'Delete project?' : 'Leave project?'
        }
      >
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-200">
          {pendingProjectAction === 'delete' ? (
            <p>
              <strong>{project.title}</strong> will be permanently deleted with
              its tasks, files, chat and team. This cannot be undone.
            </p>
          ) : (
            <p>
              You will leave <strong>{project.title}</strong> and lose access to
              its tasks, files and chat. Your tasks there become unassigned. You
              can ask to join again later.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={isProjectActionRunning}
              onClick={() => setPendingProjectAction(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={isProjectActionRunning}
              className={
                pendingProjectAction === 'delete'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : undefined
              }
              onClick={handleProjectAction}
            >
              {isProjectActionRunning
                ? 'Working...'
                : pendingProjectAction === 'delete'
                  ? 'Delete project'
                  : 'Leave project'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          isOpen={isEditTaskModalOpen}
          onClose={() => setIsEditTaskModalOpen(false)}
          task={editingTask}
          assignees={assignees}
          onUpdate={handleTaskUpdate}
        />
      )}
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
