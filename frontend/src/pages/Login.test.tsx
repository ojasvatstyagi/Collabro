import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';

const auth = vi.hoisted(() => ({ login: vi.fn(), isAuthenticated: false }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));
// The real layout brings in the particle animation, which has no place in a form test
vi.mock('../components/ui/AuthLayout', () => ({
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/explore" element={<p>explore page</p>} />
      </Routes>
    </MemoryRouter>
  );

const username = () => document.getElementById('username') as HTMLInputElement;
const password = () => document.getElementById('password') as HTMLInputElement;
const submit = () => screen.getByRole('button', { name: /sign in/i });

describe('Login page', () => {
  beforeEach(() => {
    auth.login.mockReset();
    auth.isAuthenticated = false;
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('refuses an empty form without calling the server, and says what is wrong', async () => {
    renderLogin();

    await userEvent.click(submit());

    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('checks the length of the password', async () => {
    renderLogin();

    await userEvent.type(username(), 'alice');
    await userEvent.type(password(), 'abc');
    await userEvent.click(submit());

    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('clears a field\'s error as soon as the person starts correcting it', async () => {
    renderLogin();
    await userEvent.click(submit());
    expect(screen.getByText('Username is required')).toBeInTheDocument();

    await userEvent.type(username(), 'a');

    expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('trims the username but sends the password exactly as typed', async () => {
    auth.login.mockResolvedValue(undefined);
    renderLogin();

    await userEvent.type(username(), '  alice  ');
    await userEvent.type(password(), ' pw secret ');
    await userEvent.click(submit());

    expect(auth.login).toHaveBeenCalledWith({ username: 'alice', password: ' pw secret ' });
  });

  it('shows the server\'s message, e.g. the lock-out after too many failed logins, and lets the person try again', async () => {
    auth.login.mockRejectedValue({ message: 'Too many failed login attempts. Try again later.', status: 429 });
    renderLogin();

    await userEvent.type(username(), 'alice');
    await userEvent.type(password(), 'secret1');
    await userEvent.click(submit());

    expect(await screen.findByText('Too many failed login attempts. Try again later.')).toBeInTheDocument();
    expect(submit()).toBeEnabled();
    expect(screen.queryByText(/login successful/i)).not.toBeInTheDocument();
  });

  it('falls back to a generic message when the failure carries none', async () => {
    auth.login.mockRejectedValue({});
    renderLogin();

    await userEvent.type(username(), 'alice');
    await userEvent.type(password(), 'secret1');
    await userEvent.click(submit());

    expect(await screen.findByText('Login failed. Please try again.')).toBeInTheDocument();
  });

  it('confirms a successful login and then moves on to Explore', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    auth.login.mockResolvedValue(undefined);
    renderLogin();

    await user.type(username(), 'alice');
    await user.type(password(), 'secret1');
    await user.click(submit());

    expect(await screen.findByText(/login successful/i)).toBeInTheDocument();
    expect(screen.queryByText('explore page')).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    await waitFor(() => expect(screen.getByText('explore page')).toBeInTheDocument());
  });

  it('does not show the form to someone who is already signed in', () => {
    auth.isAuthenticated = true;

    renderLogin();

    expect(screen.getByText('explore page')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });
});
