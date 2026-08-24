import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Teams from './Teams';
import type { PublicProfile, TeamSummary } from '../services/api/teams';

const teamsApi = vi.hoisted(() => ({ getMyTeams: vi.fn() }));
vi.mock('../services/api/teams', () => ({ teamsApi }));
const projectsApi = vi.hoisted(() => ({ leaveProject: vi.fn(), removeTeamMember: vi.fn() }));
vi.mock('../services/api/projects', () => ({ projectsApi }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ default: toast }));
vi.mock('../components/layout/DashboardLayout', () => ({
  default: ({ children, searchQuery, setSearchQuery, searchPlaceholder }: {
    children: React.ReactNode;
    searchQuery?: string;
    setSearchQuery?: (q: string) => void;
    searchPlaceholder?: string;
  }) => (
    <section>
      <input placeholder={searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery?.(e.target.value)} />
      {children}
    </section>
  ),
}));

const person = (username: string, name: string, over: Partial<PublicProfile> = {}): PublicProfile => ({
  id: 'id-' + username,
  username,
  displayName: name || username,
  firstname: name.split(' ')[0] ?? '',
  lastname: name.split(' ')[1] ?? '',
  bio: null,
  education: null,
  location: null,
  profilePictureUrl: null,
  skills: [],
  ...over,
});

const olive = person('olive_e2e', 'Olive Owner');
const mia = person('mia_e2e', 'Mia Moss', { skills: [{ id: 's', name: 'Welding', proficiency: 'EXPERT' }] });
const nia = person('nia_e2e', ''); // never entered a name: shown by username

const team = (over: Partial<TeamSummary> = {}): TeamSummary => ({
  id: 1,
  name: 'Bridge Team',
  projectId: 'proj-1',
  projectTitle: 'Bridge Builders',
  projectStatus: 'ACTIVE',
  role: 'OWNER',
  owner: olive,
  members: [mia, nia],
  memberCount: 3,
  createdAt: '2026-11-01T10:00:00',
  ...over,
});

const renderPage = (teams: TeamSummary[]) => {
  teamsApi.getMyTeams.mockResolvedValue({ success: true, data: teams });
  render(
    <MemoryRouter>
      <Teams />
    </MemoryRouter>
  );
};

describe('Teams page', () => {
  beforeEach(() => {
    teamsApi.getMyTeams.mockReset();
    projectsApi.leaveProject.mockReset();
    projectsApi.removeTeamMember.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it('lists my teams with my role and the member count', async () => {
    renderPage([team(), team({ id: 2, name: 'Tunnel Team', projectTitle: 'Tunnels', role: 'MEMBER', memberCount: 1, members: [] })]);

    expect(await screen.findByText('Bridge Team')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
    expect(screen.getByText('3 members')).toBeInTheDocument();
    expect(screen.getByText('1 member')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /open workspace/i }).map((l) => l.getAttribute('href'))).toEqual([
      '/project/proj-1',
      '/project/proj-1',
    ]);
  });

  it('counts owned and joined teams in the filters and filters by them', async () => {
    renderPage([team(), team({ id: 2, name: 'Tunnel Team', role: 'MEMBER' })]);
    await screen.findByText('Bridge Team');

    expect(screen.getByRole('button', { name: 'All (2)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Joined (1)' }));

    expect(screen.queryByText('Bridge Team')).not.toBeInTheDocument();
    expect(screen.getByText('Tunnel Team')).toBeInTheDocument();
  });

  it('shows members by name, links each to their profile, and never as "New User"', async () => {
    renderPage([team()]);
    await userEvent.click(await screen.findByRole('button', { name: /show members/i }));

    expect(screen.getByRole('link', { name: 'Olive Owner' })).toHaveAttribute('href', '/users/olive_e2e');
    expect(screen.getByRole('link', { name: 'Mia Moss' })).toHaveAttribute('href', '/users/mia_e2e');
    expect(screen.getByText('@mia_e2e')).toBeInTheDocument();
    // no name entered: the username is the name, and the @handle line would only repeat it
    expect(screen.getByRole('link', { name: 'nia_e2e' })).toHaveAttribute('href', '/users/nia_e2e');
    expect(screen.queryByText('@nia_e2e')).not.toBeInTheDocument();
    expect(screen.queryByText(/new user/i)).not.toBeInTheDocument();
    expect(screen.getByText('Welding')).toBeInTheDocument();
  });

  it('finds a team by the name or username of someone in it', async () => {
    renderPage([team(), team({ id: 2, name: 'Tunnel Team', owner: person('zed_e2e', 'Zed Zane'), members: [] })]);
    await screen.findByText('Bridge Team');
    const search = screen.getByPlaceholderText(/search teams, projects or people/i);

    await userEvent.type(search, 'nia_e2e');
    expect(screen.getByText('Bridge Team')).toBeInTheDocument();
    expect(screen.queryByText('Tunnel Team')).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'zed zane');
    expect(screen.getByText('Tunnel Team')).toBeInTheDocument();
    expect(screen.queryByText('Bridge Team')).not.toBeInTheDocument();
  });

  it('only lets the owner remove a member, after confirming, and names who loses access', async () => {
    projectsApi.removeTeamMember.mockResolvedValue({ success: true });
    renderPage([team()]);
    await userEvent.click(await screen.findByRole('button', { name: /show members/i }));

    await userEvent.click(screen.getByTitle('Remove Mia Moss from the team'));

    expect(screen.getByText('Remove member?')).toBeInTheDocument();
    expect(screen.getByText("Mia Moss will lose access to Bridge Builders's workspace.")).toBeInTheDocument();
    expect(projectsApi.removeTeamMember).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(projectsApi.removeTeamMember).toHaveBeenCalledWith('proj-1', 'id-mia_e2e');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Mia Moss was removed from the team'));
    expect(teamsApi.getMyTeams).toHaveBeenCalledTimes(2); // reloaded afterwards
  });

  it('names an unnamed member by username in the removal prompt', async () => {
    renderPage([team()]);
    await userEvent.click(await screen.findByRole('button', { name: /show members/i }));

    await userEvent.click(screen.getByTitle('Remove nia_e2e from the team'));

    expect(screen.getByText("nia_e2e will lose access to Bridge Builders's workspace.")).toBeInTheDocument();
  });

  it('shows no remove buttons to a member who is not the owner', async () => {
    renderPage([team({ role: 'MEMBER' })]);
    await userEvent.click(await screen.findByRole('button', { name: /show members/i }));

    expect(screen.queryByTitle(/remove .* from the team/i)).not.toBeInTheDocument();
  });

  it('cancelling the prompt changes nothing', async () => {
    renderPage([team()]);
    await userEvent.click(await screen.findByRole('button', { name: /show members/i }));
    await userEvent.click(screen.getByTitle('Remove Mia Moss from the team'));

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Remove member?')).not.toBeInTheDocument();
    expect(projectsApi.removeTeamMember).not.toHaveBeenCalled();
  });

  it('lets a member leave a team after confirming', async () => {
    projectsApi.leaveProject.mockResolvedValue({ success: true });
    renderPage([team({ role: 'MEMBER' })]);
    await screen.findByText('Bridge Team');

    await userEvent.click(screen.getByRole('button', { name: /^leave team$/i }));
    const dialog = screen.getByText('Leave team?').closest('div') as HTMLElement;
    expect(within(dialog.parentElement as HTMLElement).getByText("You will lose access to Bridge Builders's workspace.")).toBeInTheDocument();
    const leaveButtons = screen.getAllByRole('button', { name: /^leave team$/i });
    await userEvent.click(leaveButtons[leaveButtons.length - 1]);

    expect(projectsApi.leaveProject).toHaveBeenCalledWith('proj-1');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('You left Bridge Team'));
  });

  it('says so, and offers a retry, when the teams cannot be loaded', async () => {
    teamsApi.getMyTeams.mockRejectedValueOnce({ message: 'Server is down' });
    render(
      <MemoryRouter>
        <Teams />
      </MemoryRouter>
    );

    expect(await screen.findByText('Server is down')).toBeInTheDocument();
    teamsApi.getMyTeams.mockResolvedValue({ success: true, data: [team()] });
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('Bridge Team')).toBeInTheDocument();
  });
});
