import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Sidebar from './SideBar';
import { REQUESTS_CHANGED_EVENT } from '../../services/api/requests';

const api = vi.hoisted(() => ({ getRequestStats: vi.fn() }));
vi.mock('../../services/api/requests', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/api/requests')>()),
  requestsApi: api,
}));
const auth = vi.hoisted(() => ({
  user: { username: 'olive_e2e', firstname: '', lastname: '', profilePictureUrl: '' } as { username: string; firstname: string; lastname: string; profilePictureUrl: string } | null,
  logout: vi.fn(),
}));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }));

const stats = (pendingReceived: number) => ({ success: true, data: { pendingReceived } });

const GoTo = ({ to }: { to: string }) => {
  const navigate = useNavigate();
  return <button onClick={() => navigate(to)}>go {to}</button>;
};

const renderSidebar = () =>
  render(
    <MemoryRouter initialEntries={['/explore']}>
      <Sidebar isCollapsed={false} setIsCollapsed={() => undefined} />
      <GoTo to="/teams" />
      <Routes>
        <Route path="*" element={null} />
      </Routes>
    </MemoryRouter>
  );

const receivedLink = () => screen.getByRole('link', { name: /received requests/i });

describe('Sidebar', () => {
  beforeEach(() => {
    api.getRequestStats.mockReset();
    auth.user = { username: 'olive_e2e', firstname: '', lastname: '', profilePictureUrl: '' };
  });

  it('has a page for the requests I received and one for the requests I sent', async () => {
    api.getRequestStats.mockResolvedValue(stats(0));
    renderSidebar();

    expect(receivedLink()).toHaveAttribute('href', '/requests');
    expect(screen.getByRole('link', { name: /sent requests/i })).toHaveAttribute('href', '/my-requests');
    await waitFor(() => expect(api.getRequestStats).toHaveBeenCalled());
  });

  it('shows how many requests are waiting for my decision', async () => {
    api.getRequestStats.mockResolvedValue(stats(3));
    renderSidebar();

    expect(await screen.findByLabelText('3 waiting for your decision')).toHaveTextContent('3');
    expect(receivedLink()).toContainElement(screen.getByLabelText('3 waiting for your decision'));
  });

  it('shows no badge when nothing is waiting', async () => {
    api.getRequestStats.mockResolvedValue(stats(0));
    renderSidebar();
    await waitFor(() => expect(api.getRequestStats).toHaveBeenCalled());

    expect(screen.queryByLabelText(/waiting for your decision/)).not.toBeInTheDocument();
  });

  it('does not let a huge number break the layout', async () => {
    api.getRequestStats.mockResolvedValue(stats(250));
    renderSidebar();

    expect(await screen.findByLabelText('250 waiting for your decision')).toHaveTextContent('99+');
  });

  it('refreshes right after a request is answered or withdrawn', async () => {
    api.getRequestStats.mockResolvedValue(stats(2));
    renderSidebar();
    expect(await screen.findByLabelText('2 waiting for your decision')).toBeInTheDocument();

    api.getRequestStats.mockResolvedValue(stats(1));
    act(() => {
      window.dispatchEvent(new Event(REQUESTS_CHANGED_EVENT));
    });

    expect(await screen.findByLabelText('1 waiting for your decision')).toBeInTheDocument();
  });

  it('refreshes when the person moves to another page', async () => {
    api.getRequestStats.mockResolvedValue(stats(1));
    renderSidebar();
    expect(await screen.findByLabelText('1 waiting for your decision')).toBeInTheDocument();

    api.getRequestStats.mockResolvedValue(stats(4));
    await userEvent.click(screen.getByText('go /teams'));

    expect(await screen.findByLabelText('4 waiting for your decision')).toBeInTheDocument();
  });

  it('keeps showing the last count when the server cannot be reached', async () => {
    api.getRequestStats.mockResolvedValue(stats(2));
    renderSidebar();
    expect(await screen.findByLabelText('2 waiting for your decision')).toBeInTheDocument();

    api.getRequestStats.mockRejectedValue({ message: 'down' });
    await userEvent.click(screen.getByText('go /teams'));
    await waitFor(() => expect(api.getRequestStats).toHaveBeenCalledTimes(2));

    expect(screen.getByLabelText('2 waiting for your decision')).toBeInTheDocument();
  });

  it('does not ask for the count when nobody is signed in', () => {
    auth.user = null;

    renderSidebar();

    expect(api.getRequestStats).not.toHaveBeenCalled();
  });
});
