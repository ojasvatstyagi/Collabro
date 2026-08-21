import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { SESSION_EXPIRED_EVENT } from '../services/api/base';

const api = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('../services/api/auth', () => ({ authApi: api }));

const alice = { id: '1', username: 'alice', email: 'a@x.co' };

const Probe = () => {
  const { user, loading, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <p data-testid="state">{loading ? 'loading' : isAuthenticated ? `in:${user?.username}` : 'out'}</p>
      <button onClick={() => void login({ username: 'alice', password: 'pw' })}>login</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('starts in a loading state and then knows the signed-in user', async () => {
    api.getCurrentUser.mockResolvedValue({ data: { user: alice } });

    renderProvider();

    expect(screen.getByTestId('state')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('in:alice'));
  });

  it('treats a failed session check as signed out (never logged in, or the refresh token is gone)', async () => {
    api.getCurrentUser.mockRejectedValue({ message: 'nope', status: 401 });

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('out'));
  });

  it('signs the user out when the API client reports that the session can no longer be refreshed', async () => {
    api.getCurrentUser.mockResolvedValue({ data: { user: alice } });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('in:alice'));

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });

    expect(screen.getByTestId('state')).toHaveTextContent('out');
  });

  it('signs in through the API and signs out again', async () => {
    api.getCurrentUser.mockRejectedValue({ message: 'no session' });
    api.login.mockResolvedValue({ data: { user: alice } });
    api.logout.mockResolvedValue({});
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('out'));

    await userEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('in:alice'));
    expect(api.login).toHaveBeenCalledWith({ username: 'alice', password: 'pw' });

    await userEvent.click(screen.getByText('logout'));
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('out'));
  });

  it('stops listening for the expiry event once it is gone', async () => {
    api.getCurrentUser.mockResolvedValue({ data: { user: alice } });
    const remove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderProvider();
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('in:alice'));

    unmount();

    expect(remove).toHaveBeenCalledWith(SESSION_EXPIRED_EVENT, expect.any(Function));
  });
});
