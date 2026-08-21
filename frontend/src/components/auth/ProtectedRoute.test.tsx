import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const auth = vi.hoisted(() => ({ isAuthenticated: false, loading: false }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => auth }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/explore" element={<p>explore page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    auth.isAuthenticated = false;
    auth.loading = false;
  });

  it('sends a visitor who is not signed in to the login page', () => {
    renderAt('/explore');

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('explore page')).not.toBeInTheDocument();
  });

  it('shows the page to a signed-in user', () => {
    auth.isAuthenticated = true;

    renderAt('/explore');

    expect(screen.getByText('explore page')).toBeInTheDocument();
  });

  it('waits while the session is still being checked, instead of bouncing a signed-in user to the login page', () => {
    auth.loading = true;

    renderAt('/explore');

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});
