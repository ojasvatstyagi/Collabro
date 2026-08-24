import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserProfile from './UserProfile';
import type { PublicProfile } from '../services/api/teams';
import type { Project } from '../services/api/projects';

const profileApi = vi.hoisted(() => ({ getPublicProfile: vi.fn() }));
vi.mock('../services/api/profile', () => ({ profileApi }));
const projectsApi = vi.hoisted(() => ({ getUserProjects: vi.fn() }));
vi.mock('../services/api/projects', () => ({ projectsApi }));
const auth = vi.hoisted(() => ({ user: { username: 'viewer' } as { username: string } | null }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../components/layout/DashboardLayout', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section>
      <header>{title}</header>
      {children}
    </section>
  ),
}));

const mia: PublicProfile = {
  id: 'p-mia',
  username: 'mia_e2e',
  displayName: 'Mia Moss',
  firstname: 'Mia',
  lastname: 'Moss',
  bio: 'I weld bridges',
  education: 'ETH',
  location: 'Zurich',
  profilePictureUrl: null,
  skills: [{ id: 's1', name: 'Welding', proficiency: 'EXPERT' }],
};

const project = (over: Partial<Project> = {}): Project =>
  ({
    id: 'pr1',
    title: 'Mia Bridge',
    description: 'a bridge',
    technologies: ['Steel', 'Rivets'],
    status: 'ACTIVE',
    level: null,
    ...over,
  }) as Project;

const renderAt = (username: string) =>
  render(
    <MemoryRouter initialEntries={[`/users/${username}`]}>
      <Routes>
        <Route path="/users/:username" element={<UserProfile />} />
        <Route path="/explore" element={<p>explore page</p>} />
        <Route path="/profile" element={<p>own profile editor</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('UserProfile page', () => {
  beforeEach(() => {
    profileApi.getPublicProfile.mockReset();
    projectsApi.getUserProjects.mockReset();
    auth.user = { username: 'viewer' };
  });

  it('shows the person: name, username, place, education, bio, skills and the projects they started', async () => {
    profileApi.getPublicProfile.mockResolvedValue({ success: true, data: mia });
    projectsApi.getUserProjects.mockResolvedValue({ success: true, data: [project()] });

    renderAt('mia_e2e');

    expect(await screen.findByRole('heading', { name: 'Mia Moss' })).toBeInTheDocument();
    expect(profileApi.getPublicProfile).toHaveBeenCalledWith('mia_e2e');
    expect(projectsApi.getUserProjects).toHaveBeenCalledWith('p-mia');
    expect(screen.getByText('@mia_e2e')).toBeInTheDocument();
    expect(screen.getByText('Zurich')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('I weld bridges')).toBeInTheDocument();
    expect(screen.getByText('Welding')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
    expect(screen.getByText('Projects (1)')).toBeInTheDocument();
    expect(screen.getByText('Mia Bridge')).toBeInTheDocument();
    expect(screen.getByText('Steel')).toBeInTheDocument();
  });

  it('shows the initials when there is no picture, and a person without a name by their username', async () => {
    profileApi.getPublicProfile.mockResolvedValue({
      success: true,
      data: { ...mia, username: 'nia_e2e', displayName: 'nia_e2e', firstname: '', lastname: '', bio: null, skills: [] },
    });
    projectsApi.getUserProjects.mockResolvedValue({ success: true, data: [] });

    renderAt('nia_e2e');

    expect(await screen.findByRole('heading', { name: 'nia_e2e' })).toBeInTheDocument();
    expect(screen.getByText('NI')).toBeInTheDocument();
    expect(screen.getByText('No bio yet.')).toBeInTheDocument();
    expect(screen.getByText('No skills listed.')).toBeInTheDocument();
    expect(screen.getByText('No projects yet.')).toBeInTheDocument();
    expect(screen.queryByText(/new user/i)).not.toBeInTheDocument();
  });

  it('shows the picture when there is one', async () => {
    profileApi.getPublicProfile.mockResolvedValue({ success: true, data: { ...mia, profilePictureUrl: '/api/profile/picture/m.png' } });
    projectsApi.getUserProjects.mockResolvedValue({ success: true, data: [] });

    renderAt('mia_e2e');

    expect(await screen.findByRole('img', { name: 'Mia Moss' })).toHaveAttribute('src', '/api/profile/picture/m.png');
  });

  it('says there is no such user for a 404 (unknown or deleted), and does not ask for projects', async () => {
    profileApi.getPublicProfile.mockRejectedValue({ message: 'Profile not found', status: 404 });

    renderAt('ghost');

    expect(await screen.findByText('No such user')).toBeInTheDocument();
    expect(screen.getByText(/no account called @ghost/i)).toBeInTheDocument();
    expect(projectsApi.getUserProjects).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /back to explore/i })).toHaveAttribute('href', '/explore');
  });

  it('shows another kind of failure with a retry that loads the profile', async () => {
    profileApi.getPublicProfile.mockRejectedValueOnce({ message: 'Server is down', status: 500 });
    renderAt('mia_e2e');
    expect(await screen.findByText('Server is down')).toBeInTheDocument();
    expect(screen.queryByText('No such user')).not.toBeInTheDocument();

    profileApi.getPublicProfile.mockResolvedValue({ success: true, data: mia });
    projectsApi.getUserProjects.mockResolvedValue({ success: true, data: [] });
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByRole('heading', { name: 'Mia Moss' })).toBeInTheDocument();
  });

  it('offers to edit your own profile, but not someone else\'s', async () => {
    profileApi.getPublicProfile.mockResolvedValue({ success: true, data: mia });
    projectsApi.getUserProjects.mockResolvedValue({ success: true, data: [] });

    auth.user = { username: 'mia_e2e' };
    const { unmount } = renderAt('mia_e2e');
    expect(await screen.findByRole('button', { name: /edit my profile/i })).toBeInTheDocument();
    unmount();

    auth.user = { username: 'viewer' };
    renderAt('mia_e2e');
    await screen.findByRole('heading', { name: 'Mia Moss' });
    expect(screen.queryByRole('button', { name: /edit my profile/i })).not.toBeInTheDocument();
  });

  it('loads the new person when the address changes from one profile to another (the same page stays mounted)', async () => {
    profileApi.getPublicProfile.mockImplementation(async (name: string) => ({
      success: true,
      data: { ...mia, id: 'p-' + name, username: name, displayName: name === 'mia_e2e' ? 'Mia Moss' : 'Owen Ow' },
    }));
    projectsApi.getUserProjects.mockResolvedValue({ success: true, data: [] });
    const GoToOwen = () => {
      const navigate = useNavigate();
      return <button onClick={() => navigate('/users/owen_e2e')}>go to owen</button>;
    };
    render(
      <MemoryRouter initialEntries={['/users/mia_e2e']}>
        <GoToOwen />
        <Routes>
          <Route path="/users/:username" element={<UserProfile />} />
        </Routes>
      </MemoryRouter>
    );
    await screen.findByRole('heading', { name: 'Mia Moss' });

    await userEvent.click(screen.getByText('go to owen'));

    expect(await screen.findByRole('heading', { name: 'Owen Ow' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Mia Moss' })).not.toBeInTheDocument();
    expect(projectsApi.getUserProjects).toHaveBeenLastCalledWith('p-owen_e2e');
  });
});
