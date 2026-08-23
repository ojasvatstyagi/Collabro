import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectWorkspace from './ProjectWorkspace';
import type { Project, Task } from '../services/api/projects';
import type { PublicProfile } from '../services/api/teams';

const api = vi.hoisted(() => ({
  getProjectById: vi.fn(),
  getProjectTasks: vi.fn(),
  getProjectTeam: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));
vi.mock('../services/api/projects', () => ({ projectsApi: api }));
const auth = vi.hoisted(() => ({ user: { username: 'olive_e2e' } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ toast, default: toast }));
vi.mock('../components/layout/DashboardLayout', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section>
      <header>{title}</header>
      {children}
    </section>
  ),
}));
// These tabs fetch and poll on their own and are not what is being tested
vi.mock('../components/workspace/ChatTab', () => ({ default: () => null }));
vi.mock('../components/workspace/FilesTab', () => ({ default: () => null }));

const owner = { id: 'owner-profile', username: 'olive_e2e', displayName: 'olive_e2e', profilePictureUrl: '' };

const project = (over: Partial<Project> = {}): Project =>
  ({
    id: 'proj-1',
    title: 'Bridge Builders',
    description: 'We build bridges',
    technologies: ['Steel'],
    level: null, // created through the API: no level
    duration: '2 months',
    teamSize: 4,
    category: 'Engineering',
    budget: 'none',
    isRemote: true,
    isOpenSource: false,
    contactMethod: 'platform',
    additionalInfo: '',
    status: 'ACTIVE',
    createdAt: '2026-11-01T10:00:00',
    createdBy: owner,
    ...over,
  }) as Project;

const mia: PublicProfile = {
  id: 'mia-profile',
  username: 'mia_e2e',
  displayName: 'Mia Moss',
  firstname: 'Mia',
  lastname: 'Moss',
  bio: null,
  education: null,
  location: null,
  profilePictureUrl: null,
  skills: [],
};

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Weld the first beam',
  description: null, // created through the API: no description
  status: 'PENDING',
  priority: 'MEDIUM',
  tags: [],
  dueDate: '2026-12-01T10:00',
  createdAt: '2026-11-02T10:00:00',
  projectId: 'proj-1',
  ...over,
});

const renderWorkspace = async (tasks: Task[] = []) => {
  api.getProjectById.mockResolvedValue({ success: true, data: project() });
  api.getProjectTasks.mockResolvedValue({ success: true, data: tasks });
  api.getProjectTeam.mockResolvedValue({ success: true, data: [mia] });
  render(
    <MemoryRouter initialEntries={['/project/proj-1']}>
      <Routes>
        <Route path="/project/:projectId" element={<ProjectWorkspace />} />
      </Routes>
    </MemoryRouter>
  );
  await screen.findAllByText('Bridge Builders');
};

const openTasks = () => userEvent.click(screen.getByRole('button', { name: 'Tasks' }));
const assigneeSelect = () =>
  screen.getAllByRole('combobox').find((s) => within(s).queryByText('Unassigned')) as HTMLSelectElement;

describe('Project workspace', () => {
  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it('opens for a project that has no level, instead of going blank', async () => {
    await renderWorkspace();

    expect(screen.getByText('not specified')).toBeInTheDocument();
    expect(screen.getByText('We build bridges')).toBeInTheDocument();
  });

  it('lists a task that has no description, instead of crashing the tab', async () => {
    await renderWorkspace([task()]);

    await openTasks();

    expect(screen.getByText('Weld the first beam')).toBeInTheDocument();
  });

  it('shows the reason when the project cannot be loaded', async () => {
    api.getProjectById.mockRejectedValue({ message: 'Project not found' });
    api.getProjectTasks.mockResolvedValue({ success: true, data: [] });
    api.getProjectTeam.mockResolvedValue({ success: true, data: [] });
    render(
      <MemoryRouter initialEntries={['/project/proj-1']}>
        <Routes>
          <Route path="/project/:projectId" element={<ProjectWorkspace />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Project not found')).toBeInTheDocument();
  });

  it('offers the owner first in the new-task form, then the team', async () => {
    await renderWorkspace();
    await openTasks();
    await userEvent.click(screen.getByRole('button', { name: /new task/i }));

    expect(within(assigneeSelect()).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Unassigned',
      'olive_e2e (owner)',
      'Mia Moss (mia_e2e)',
    ]);
  });

  it('creates a task given to the owner and shows it on the board', async () => {
    const created = task({ id: 't2', title: 'Inspect the rivets', assigneeId: 'owner-profile', assigneeName: 'olive_e2e' });
    api.createTask.mockResolvedValue({ success: true, data: created });
    await renderWorkspace();
    await openTasks();
    await userEvent.click(screen.getByRole('button', { name: /new task/i }));

    await userEvent.type(screen.getByPlaceholderText('e.g. Implement Login Page'), 'Inspect the rivets');
    await userEvent.selectOptions(assigneeSelect(), 'owner-profile');
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() =>
      expect(api.createTask).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({ title: 'Inspect the rivets', assigneeId: 'owner-profile', priority: 'MEDIUM' })
      )
    );
    expect(await screen.findByText('Inspect the rivets')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. Implement Login Page')).not.toBeInTheDocument(); // the modal closed
  });

  it('will not create a task without a title: the button is disabled, and a title of only spaces is refused', async () => {
    await renderWorkspace();
    await openTasks();
    await userEvent.click(screen.getByRole('button', { name: /new task/i }));
    expect(screen.getByRole('button', { name: /create task/i })).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText('e.g. Implement Login Page'), '   ');
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));

    expect(toast.error).toHaveBeenCalledWith('Give the task a title');
    expect(api.createTask).not.toHaveBeenCalled();
  });

  it('keeps the form open with what was typed when creating fails', async () => {
    api.createTask.mockRejectedValue({ message: 'Assignee is not part of this project' });
    await renderWorkspace();
    await openTasks();
    await userEvent.click(screen.getByRole('button', { name: /new task/i }));

    await userEvent.type(screen.getByPlaceholderText('e.g. Implement Login Page'), 'Inspect the rivets');
    await userEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Assignee is not part of this project'));
    expect(screen.getByPlaceholderText('e.g. Implement Login Page')).toHaveValue('Inspect the rivets');
  });

  it('shows the owner as the current assignee when a task given to them is opened for editing', async () => {
    await renderWorkspace([task({ assigneeId: 'owner-profile', assigneeName: 'olive_e2e' })]);
    await openTasks();

    await userEvent.click(screen.getByTitle('Edit Task'));

    const select = screen.getAllByRole('combobox').find((s) => within(s).queryByText('olive_e2e (owner)')) as HTMLSelectElement;
    expect(select).toHaveValue('owner-profile');
  });
});
