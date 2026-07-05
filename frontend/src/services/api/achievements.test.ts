import { AxiosAdapter, AxiosError, AxiosInstance } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { achievementsApi, type AchievementOverview } from './achievements';

const client = (achievementsApi as unknown as { client: AxiosInstance }).client;
const originalAdapter = client.defaults.adapter;

const overview: AchievementOverview = {
  stats: {
    projectsCompleted: 1,
    projectsCreated: 2,
    collaborations: 3,
    tasksCompleted: 4,
    badgesEarned: 1,
    totalBadges: 13,
    totalPoints: 50,
    level: 1,
    rank: 'Newcomer',
    experience: { current: 50, required: 100 },
  },
  achievements: [
    {
      id: 'first-launch',
      name: 'First Launch',
      description: 'Create a project',
      category: 'projects',
      icon: 'Rocket',
      rarity: 'common',
      points: 50,
      isUnlocked: true,
      progress: { current: 1, required: 1 },
      requirements: ['Create 1 project'],
    },
  ],
};

const respondWith = (status: number, data: unknown) => {
  const urls: Array<string | undefined> = [];
  const adapter: AxiosAdapter = async (config) => {
    urls.push(config.url);
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      throw new AxiosError('request failed', String(status), config, null, response);
    }
    return response;
  };
  client.defaults.adapter = adapter;
  return urls;
};

afterEach(() => {
  client.defaults.adapter = originalAdapter;
});

describe('achievementsApi.getMyAchievements', () => {
  it('requests /achievements/me and returns the body intact', async () => {
    const urls = respondWith(200, overview);

    const response = await achievementsApi.getMyAchievements();

    expect(urls).toEqual(['/achievements/me']);
    expect(response.success).toBe(true);
    expect(response.data).toEqual(overview);
    expect(response.data?.achievements[0].isUnlocked).toBe(true);
  });

  it('throws the server message on failure', async () => {
    respondWith(500, { message: 'Boom' });

    await expect(achievementsApi.getMyAchievements()).rejects.toMatchObject({
      message: 'Boom',
      status: 500,
    });
  });
});
