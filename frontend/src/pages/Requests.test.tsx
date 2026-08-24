import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Requests from './Requests';
import type { JoinRequest } from '../services/api/requests';

const api = vi.hoisted(() => ({
  getReceivedRequests: vi.fn(),
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));
vi.mock('../services/api/requests', () => ({ requestsApi: api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ toast, default: toast }));
// Navigation chrome that has nothing to do with what the page lists
vi.mock('../components/ui/SideBar', () => ({ default: () => <nav /> }));
vi.mock('../components/ui/ThemeToggle', () => ({ default: () => null }));

type Requester = JoinRequest['requester'];

const request = (
  over: Partial<Omit<JoinRequest, 'requester'>> & { requester?: Partial<Requester> } = {}
): JoinRequest => {
  const { requester, ...rest } = over;
  return {
    id: 1,
    projectId: 'p1',
    projectTitle: 'Bridge Builders',
    message: 'let me weld',
    status: 'PENDING',
    createdAt: '2026-11-01T10:00:00',
    updatedAt: '2026-11-01T10:00:00',
    ...rest,
    requester: {
      id: 'r1',
      username: 'mia_e2e',
      displayName: 'Mia Moss',
      firstname: 'Mia',
      lastname: 'Moss',
      profilePictureUrl: '',
      skills: ['Welding', 'Steel'],
      ...requester,
    },
  };
};

const unnamed = request({
  id: 2,
  projectTitle: 'Tunnel Crew',
  message: 'me too',
  requester: { id: 'r2', username: 'nia_e2e', displayName: 'nia_e2e', firstname: '', lastname: '', skills: [] },
});

const renderPage = (requests: JoinRequest[]) => {
  api.getReceivedRequests.mockResolvedValue({ success: true, data: requests });
  render(
    <MemoryRouter>
      <Requests />
    </MemoryRouter>
  );
};

const card = (name: string) => screen.getByText(name).closest('div.rounded-lg') as HTMLElement;

describe('Requests page', () => {
  beforeEach(() => {
    api.getReceivedRequests.mockReset();
    api.approveRequest.mockReset();
    api.rejectRequest.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it('asks for the pending requests first and lists them', async () => {
    renderPage([request(), unnamed]);

    expect(await screen.findByText('Mia Moss')).toBeInTheDocument();
    expect(api.getReceivedRequests).toHaveBeenCalledWith('PENDING');
    expect(screen.getByText('Bridge Builders')).toBeInTheDocument();
    expect(screen.getByText('"let me weld"')).toBeInTheDocument();
    expect(screen.getByText('Welding')).toBeInTheDocument();
  });

  it('shows a person who has no name by their username once, never as "New User", and links to their profile', async () => {
    renderPage([request(), unnamed]);
    await screen.findByText('Mia Moss');

    // named: the name links to the profile and the handle is shown under it
    expect(screen.getByRole('link', { name: 'Mia Moss' })).toHaveAttribute('href', '/users/mia_e2e');
    expect(screen.getByText('@mia_e2e')).toBeInTheDocument();
    // unnamed: the username is the name, so there is no second "@nia_e2e" line repeating it
    expect(screen.getByRole('link', { name: 'nia_e2e' })).toHaveAttribute('href', '/users/nia_e2e');
    expect(screen.queryByText('@nia_e2e')).not.toBeInTheDocument();
    expect(screen.queryByText(/new user/i)).not.toBeInTheDocument();
  });

  it('shows the first letters of the name in place of a missing picture', async () => {
    renderPage([request()]);

    expect(await screen.findByText('MM')).toBeInTheDocument();
  });

  it('does not link a requester whose account no longer exists', async () => {
    renderPage([request({ requester: { username: 'deleted user', displayName: 'Deleted User' } })]);

    expect(await screen.findByText('Deleted User')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Deleted User' })).not.toBeInTheDocument();
  });

  it('adds the person to the team on approval and shows the request as approved', async () => {
    api.approveRequest.mockResolvedValue({ success: true, message: 'Added to the team' });
    renderPage([request(), unnamed]);
    await screen.findByText('Mia Moss');

    await userEvent.click(within(card('Mia Moss')).getByRole('button', { name: /add to team/i }));

    expect(api.approveRequest).toHaveBeenCalledWith(1);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Added to the team'));
    expect(within(card('Mia Moss')).getByText('Approved')).toBeInTheDocument();
    expect(within(card('Mia Moss')).queryByRole('button', { name: /add to team/i })).not.toBeInTheDocument();
    // the other request is untouched
    expect(within(card('nia_e2e')).getByRole('button', { name: /add to team/i })).toBeInTheDocument();
  });

  it('says so and leaves the request pending when approving fails', async () => {
    api.approveRequest.mockRejectedValue({ message: 'Team is full' });
    renderPage([request()]);
    await screen.findByText('Mia Moss');

    await userEvent.click(screen.getByRole('button', { name: /add to team/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Team is full'));
    expect(screen.getByRole('button', { name: /add to team/i })).toBeEnabled();
    expect(screen.queryByText('Approved')).not.toBeInTheDocument();
  });

  it('declines a request', async () => {
    api.rejectRequest.mockResolvedValue({ success: true });
    renderPage([request()]);
    await screen.findByText('Mia Moss');

    await userEvent.click(screen.getByRole('button', { name: /decline/i }));

    expect(api.rejectRequest).toHaveBeenCalledWith(1);
    expect(await screen.findByText('Rejected')).toBeInTheDocument();
  });

  it('narrows the list as the person types, by display name or project', async () => {
    renderPage([request(), unnamed]);
    await screen.findByText('Mia Moss');
    const search = screen.getByPlaceholderText('Search requests...');

    await userEvent.type(search, 'nia');
    expect(screen.queryByText('Mia Moss')).not.toBeInTheDocument();
    expect(screen.getByText('nia_e2e')).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'bridge');
    expect(screen.getByText('Mia Moss')).toBeInTheDocument();
    expect(screen.queryByText('nia_e2e')).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'zzz');
    expect(screen.getByText('No requests found')).toBeInTheDocument();
  });

  it('reloads with the chosen status when the filter changes', async () => {
    renderPage([request()]);
    await screen.findByText('Mia Moss');

    await userEvent.click(screen.getByRole('button', { name: 'ALL' }));

    await waitFor(() => expect(api.getReceivedRequests).toHaveBeenLastCalledWith(undefined));
    await userEvent.click(screen.getByRole('button', { name: 'REJECTED' }));
    await waitFor(() => expect(api.getReceivedRequests).toHaveBeenLastCalledWith('REJECTED'));
  });

  it('shows the reason a request failed to load', async () => {
    api.getReceivedRequests.mockRejectedValue({ message: 'Server is down' });
    render(
      <MemoryRouter>
        <Requests />
      </MemoryRouter>
    );

    expect(await screen.findByText('Server is down')).toBeInTheDocument();
  });
});
