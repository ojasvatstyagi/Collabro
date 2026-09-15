import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyRequests from './MyRequests';
import { REQUESTS_CHANGED_EVENT, type JoinRequest } from '../services/api/requests';

const api = vi.hoisted(() => ({ getSentRequests: vi.fn(), cancelRequest: vi.fn() }));
vi.mock('../services/api/requests', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/api/requests')>()),
  requestsApi: api,
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: toast }));
vi.mock('../components/layout/DashboardLayout', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section>
      <header>{title}</header>
      {children}
    </section>
  ),
}));

const sent = (over: Partial<JoinRequest> = {}): JoinRequest => ({
  id: 1,
  projectId: 'proj-1',
  projectTitle: 'Bridge Builders',
  ownerUsername: 'olive_e2e',
  ownerDisplayName: 'Olive Owner',
  message: 'let me weld',
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  requester: { id: 'me', username: 'mia_e2e', firstname: 'Mia', lastname: 'Moss', profilePictureUrl: '', skills: [] },
  ...over,
});

const approved = sent({ id: 2, projectId: 'proj-2', projectTitle: 'Tunnel Crew', status: 'APPROVED', ownerUsername: 'zed_e2e', ownerDisplayName: 'zed_e2e', message: '' });
const declined = sent({ id: 3, projectId: 'proj-3', projectTitle: 'Rocket Club', status: 'REJECTED', message: 'count me in', rejectionReason: 'The team is full', ownerUsername: 'deleted user', ownerDisplayName: 'Deleted User' });

const renderPage = (requests: JoinRequest[]) => {
  api.getSentRequests.mockResolvedValue({ success: true, data: requests });
  render(
    <MemoryRouter>
      <MyRequests />
    </MemoryRouter>
  );
};

const card = (title: string) => screen.getByText(title).closest('li') as HTMLElement;

describe('My requests page', () => {
  beforeEach(() => {
    api.getSentRequests.mockReset();
    api.cancelRequest.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it('lists the requests I sent with where each one stands', async () => {
    renderPage([sent(), approved, declined]);

    expect(await screen.findByText('Bridge Builders')).toBeInTheDocument();
    expect(api.getSentRequests).toHaveBeenCalledTimes(1);
    expect(within(card('Bridge Builders')).getByText('Waiting for a reply')).toBeInTheDocument();
    expect(within(card('Tunnel Crew')).getByText('Approved')).toBeInTheDocument();
    expect(within(card('Rocket Club')).getByText('Declined')).toBeInTheDocument();
    expect(screen.getByText('"let me weld"')).toBeInTheDocument();
  });

  it('names who owns each project, linking to their profile unless the account is gone', async () => {
    renderPage([sent(), approved, declined]);
    await screen.findByText('Bridge Builders');

    expect(screen.getByRole('link', { name: 'Olive Owner' })).toHaveAttribute('href', '/users/olive_e2e');
    // an owner without a name is shown by username
    expect(screen.getByRole('link', { name: 'zed_e2e' })).toHaveAttribute('href', '/users/zed_e2e');
    expect(within(card('Rocket Club')).getByText(/Deleted User/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Deleted User' })).not.toBeInTheDocument();
  });

  it('sends me to the workspace once I am on the team', async () => {
    renderPage([approved]);

    const link = within(await screen.findByText('Tunnel Crew').then(() => card('Tunnel Crew'))).getByRole('link', { name: /open workspace/i });
    expect(link).toHaveAttribute('href', '/project/proj-2');
    expect(screen.getByText('You are on the team')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /withdraw/i })).not.toBeInTheDocument();
  });

  it('shows the owner\'s reason for declining, and offers nothing to withdraw', async () => {
    renderPage([declined]);

    expect(await screen.findByText('Reason: The team is full')).toBeInTheDocument();
    expect(screen.getByText('The owner declined this request')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /withdraw/i })).not.toBeInTheDocument();
  });

  it('counts the requests per status and filters by them', async () => {
    renderPage([sent(), approved, declined]);
    await screen.findByText('Bridge Builders');

    expect(screen.getByRole('button', { name: 'All (3)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Waiting (1)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Declined (1)' }));

    expect(screen.getByText('Rocket Club')).toBeInTheDocument();
    expect(screen.queryByText('Bridge Builders')).not.toBeInTheDocument();
    expect(screen.queryByText('Tunnel Crew')).not.toBeInTheDocument();
  });

  it('says so when a filter has nothing in it', async () => {
    renderPage([sent()]);
    await screen.findByText('Bridge Builders');

    await userEvent.click(screen.getByRole('button', { name: 'Approved (0)' }));

    expect(screen.getByText('Nothing in this list.')).toBeInTheDocument();
  });

  it('withdraws a pending request after confirming, and removes it from the list', async () => {
    api.cancelRequest.mockResolvedValue({ success: true });
    const heard = vi.fn();
    window.addEventListener(REQUESTS_CHANGED_EVENT, heard);
    renderPage([sent(), approved]);
    await screen.findByText('Bridge Builders');

    await userEvent.click(within(card('Bridge Builders')).getByRole('button', { name: 'Withdraw request' }));
    expect(screen.getByText('Withdraw request?')).toBeInTheDocument();
    expect(screen.getByText(/Your request to join Bridge Builders will be removed/)).toBeInTheDocument();
    expect(api.cancelRequest).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

    expect(api.cancelRequest).toHaveBeenCalledWith(1);
    await waitFor(() => expect(screen.queryByText('Bridge Builders')).not.toBeInTheDocument());
    expect(screen.getByText('Tunnel Crew')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Request withdrawn');
    expect(heard).toHaveBeenCalledTimes(1);
    window.removeEventListener(REQUESTS_CHANGED_EVENT, heard);
  });

  it('keeps the request when I change my mind', async () => {
    renderPage([sent()]);
    await screen.findByText('Bridge Builders');
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw request' }));

    await userEvent.click(screen.getByRole('button', { name: 'Keep it' }));

    expect(api.cancelRequest).not.toHaveBeenCalled();
    expect(screen.getByText('Bridge Builders')).toBeInTheDocument();
    expect(screen.queryByText('Withdraw request?')).not.toBeInTheDocument();
  });

  it('says so and keeps the request when withdrawing fails (for instance it was answered meanwhile)', async () => {
    api.cancelRequest.mockRejectedValue({ message: 'Only pending requests can be cancelled' });
    renderPage([sent()]);
    await screen.findByText('Bridge Builders');
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw request' }));

    await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Only pending requests can be cancelled'));
    expect(screen.getByText('Bridge Builders')).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('invites me to find a project when I have not sent any', async () => {
    renderPage([]);

    expect(await screen.findByText('You have not asked to join any project yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /find a project/i })).toHaveAttribute('href', '/explore');
    expect(screen.queryByRole('button', { name: /^All/ })).not.toBeInTheDocument();
  });

  it('shows why the list could not be loaded, with a retry', async () => {
    api.getSentRequests.mockRejectedValueOnce({ message: 'Server is down' });
    render(
      <MemoryRouter>
        <MyRequests />
      </MemoryRouter>
    );
    expect(await screen.findByText('Server is down')).toBeInTheDocument();

    api.getSentRequests.mockResolvedValue({ success: true, data: [sent()] });
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('Bridge Builders')).toBeInTheDocument();
  });
});
