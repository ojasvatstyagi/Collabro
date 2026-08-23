import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditTaskModal from './EditTaskModal';
import type { Task } from '../../services/api/projects';

const api = vi.hoisted(() => ({ updateTask: vi.fn() }));
vi.mock('../../services/api/projects', () => ({ projectsApi: api }));

const assignees = [
  { id: 'owner-1', label: 'olive (owner)' },
  { id: 'member-1', label: 'Mia Moss (mia)' },
  { id: 'member-2', label: 'ned' },
];

const task = (over: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Weld the beam',
  description: 'carefully',
  status: 'PENDING',
  priority: 'MEDIUM',
  tags: ['steel', 'urgent'],
  dueDate: '2026-12-01T10:00',
  createdAt: '2026-11-01T10:00:00',
  assigneeId: 'owner-1',
  projectId: 'p1',
  ...over,
});

const setup = (taskOver: Partial<Task> = {}) => {
  const onClose = vi.fn();
  const onUpdate = vi.fn();
  render(<EditTaskModal isOpen onClose={onClose} task={task(taskOver)} onUpdate={onUpdate} assignees={assignees} />);
  return { onClose, onUpdate };
};

const assigneeSelect = () =>
  screen.getAllByRole('combobox').find((s) => within(s).queryByText('Unassigned')) as HTMLSelectElement;
const save = () => screen.getByRole('button', { name: /save changes/i });

describe('EditTaskModal', () => {
  beforeEach(() => {
    api.updateTask.mockReset();
  });

  it('offers the owner first, then the team, after "Unassigned"', () => {
    setup();

    expect(within(assigneeSelect()).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Unassigned',
      'olive (owner)',
      'Mia Moss (mia)',
      'ned',
    ]);
  });

  it('shows the owner as the current assignee of a task that was given to them (it used to read "Unassigned")', () => {
    setup({ assigneeId: 'owner-1' });

    expect(assigneeSelect()).toHaveValue('owner-1');
    expect(within(assigneeSelect()).getByRole('option', { selected: true })).toHaveTextContent('olive (owner)');
  });

  it('keeps the owner assigned when the task is saved without touching the assignee', async () => {
    api.updateTask.mockResolvedValue({ success: true, data: task() });
    setup({ assigneeId: 'owner-1' });

    await userEvent.click(save());

    expect(api.updateTask).toHaveBeenCalledWith('t1', expect.objectContaining({ assigneeId: 'owner-1' }));
  });

  it('sends the new assignee, the tags as a list and an upper-case priority, then reports back and closes', async () => {
    const updated = task({ assigneeId: 'member-1', title: 'Weld both beams' });
    api.updateTask.mockResolvedValue({ success: true, data: updated });
    const { onClose, onUpdate } = setup();

    await userEvent.selectOptions(assigneeSelect(), 'member-1');
    const title = screen.getByDisplayValue('Weld the beam');
    await userEvent.clear(title);
    await userEvent.type(title, 'Weld both beams');
    const tags = screen.getByDisplayValue('steel, urgent');
    await userEvent.clear(tags);
    await userEvent.type(tags, ' a , b,, ');
    await userEvent.click(save());

    expect(api.updateTask).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({
        title: 'Weld both beams',
        assigneeId: 'member-1',
        tags: ['a', 'b'],
        priority: 'MEDIUM',
      })
    );
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(updated));
    expect(onClose).toHaveBeenCalled();
  });

  it('opens for a task without a description (the API allows it) instead of crashing', () => {
    setup({ description: null });

    expect(screen.getByDisplayValue('Weld the beam')).toBeInTheDocument();
    expect(document.querySelector('textarea')).toHaveValue('');
  });

  it('cannot save a task whose title has been emptied', async () => {
    setup();

    await userEvent.clear(screen.getByDisplayValue('Weld the beam'));

    expect(save()).toBeDisabled();
  });

  it('stays open and does not report an update when the save fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    api.updateTask.mockRejectedValue({ message: 'boom' });
    const { onClose, onUpdate } = setup();

    await userEvent.click(save());

    await waitFor(() => expect(save()).toBeEnabled());
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
