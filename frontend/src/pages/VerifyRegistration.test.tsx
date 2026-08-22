import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VerifyRegistration from './VerifyRegistration';

const api = vi.hoisted(() => ({ verifyRegistrationOtp: vi.fn(), resendRegistrationOtp: vi.fn() }));
vi.mock('../services/api/auth', () => ({ authApi: api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: toast }));

type Entry = string | { pathname: string; state?: unknown };
const renderPage = (entry: Entry) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/verify-registration" element={<VerifyRegistration />} />
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/forgot-password" element={<p>forgot page</p>} />
      </Routes>
    </MemoryRouter>
  );

const fromTheRegisterForm = () =>
  renderPage({ pathname: '/verify-registration', state: { email: 'a@b.co' } });

const email = () => document.getElementById('email') as HTMLInputElement;
const otp = () => document.getElementById('otp') as HTMLInputElement;
const resendButton = () => screen.getByRole('button', { name: /resend code|sending/i });

// The cooldown is a chain of one-second timers: each tick schedules the next after React has re-rendered
const tick = async (seconds: number) => {
  for (let i = 0; i < seconds; i++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
  }
};

describe('Verify registration page', () => {
  beforeEach(() => {
    api.verifyRegistrationOtp.mockReset();
    api.resendRegistrationOtp.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fills in the address the person just registered with, or the one in the link', () => {
    fromTheRegisterForm();
    expect(email().value).toBe('a@b.co');
  });

  it('takes the address from the e-mailed link too', () => {
    renderPage('/verify-registration?email=link%40x.co');
    expect(email().value).toBe('link@x.co');
  });

  it('tells people who never got a code to log in or reset their password, since a known address is not mailed', () => {
    fromTheRegisterForm();

    expect(screen.getByRole('link', { name: 'logging in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'resetting your password' })).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByText(/not verified within 7 days are removed/i)).toBeInTheDocument();
  });

  it('holds the resend button back for a minute right after registering, counting down', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fromTheRegisterForm();

    expect(resendButton()).toBeDisabled();
    expect(resendButton()).toHaveTextContent('Resend code in 60s');
    await tick(10);
    expect(resendButton()).toHaveTextContent('Resend code in 50s');
    await tick(50);
    expect(resendButton()).toBeEnabled();
    expect(resendButton()).toHaveTextContent('Resend code');
  });

  it('resends to the address on screen, answers with the same neutral message for everyone, and starts the wait again', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    api.resendRegistrationOtp.mockResolvedValue({});
    fromTheRegisterForm();
    await tick(60);

    await user.click(resendButton());

    expect(api.resendRegistrationOtp).toHaveBeenCalledWith({ email: 'a@b.co' });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('If that address has a pending registration'));
    await waitFor(() => expect(resendButton()).toBeDisabled());
    expect(resendButton()).toHaveTextContent('Resend code in 60s');
  });

  it('lets someone who followed the e-mailed link resend straight away', () => {
    renderPage('/verify-registration?email=link%40x.co');

    expect(resendButton()).toBeEnabled();
  });

  it('asks for an address before it resends', async () => {
    renderPage('/verify-registration');

    await userEvent.click(resendButton());

    expect(screen.getByText('Enter your email address first.')).toBeInTheDocument();
    expect(api.resendRegistrationOtp).not.toHaveBeenCalled();
  });

  it('shows an error toast when resending fails', async () => {
    api.resendRegistrationOtp.mockRejectedValue({ message: 'Server is down' });
    renderPage('/verify-registration?email=link%40x.co');

    await userEvent.click(resendButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Server is down'));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('verifies the code and then sends the person to the login page', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    api.verifyRegistrationOtp.mockResolvedValue({});
    fromTheRegisterForm();

    await user.type(otp(), '123456');
    await user.click(screen.getByRole('button', { name: /verify account/i }));

    expect(api.verifyRegistrationOtp).toHaveBeenCalledWith({ email: 'a@b.co', otp: '123456' });
    expect(await screen.findByText('Verified!')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('shows why a wrong code was refused and keeps the form', async () => {
    api.verifyRegistrationOtp.mockRejectedValue({ message: 'Invalid or expired OTP' });
    renderPage('/verify-registration?email=link%40x.co');

    await userEvent.type(otp(), '000000');
    await userEvent.click(screen.getByRole('button', { name: /verify account/i }));

    expect(await screen.findByText('Invalid or expired OTP')).toBeInTheDocument();
    expect(screen.queryByText('Verified!')).not.toBeInTheDocument();
    expect(otp()).toBeInTheDocument();
  });
});
