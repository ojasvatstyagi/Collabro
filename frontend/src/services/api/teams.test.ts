import { AxiosInstance } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { teamsApi, type TeamSummary } from './teams';

const client = (teamsApi as unknown as { client: AxiosInstance }).client;
const originalAdapter = client.defaults.adapter;

const team: TeamSummary = {
  id: 1,
  name: 'Apollo Team',
  projectId: 'p1',
  projectTitle: 'Apollo',
  projectStatus: 'ACTIVE',
  role: 'OWNER',
  owner: {
    id: 'u1',
    username: 'owner',
    firstname: 'Olive',
    lastname: 'Owner',
    bio: null,
    education: null,
    location: null,
    profilePictureUrl: null,
    skills: [{ id: 's1', name: 'Java', proficiency: 'EXPERT' }],
  },
  members: [],
  memberCount: 1,
  createdAt: '2026-01-01T10:00:00',
};

describe('teamsApi', () => {
  afterEach(() => {
    client.defaults.adapter = originalAdapter;
  });

  it('getMyTeams requests /teams/me and returns the teams intact', async () => {
    const calls: Array<{ url?: string; method?: string }> = [];
    client.defaults.adapter = async (config) => {
      calls.push({ url: config.url, method: config.method });
      return { data: [team], status: 200, statusText: '', headers: {}, config };
    };

    const result = await teamsApi.getMyTeams();

    expect(calls).toEqual([{ url: '/teams/me', method: 'get' }]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([team]);
  });
});
