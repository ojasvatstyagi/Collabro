import { AxiosInstance } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { profileApi } from './profile';

const client = (profileApi as unknown as { client: AxiosInstance }).client;
const originalAdapter = client.defaults.adapter;

describe('profileApi.getPublicProfile', () => {
  afterEach(() => {
    client.defaults.adapter = originalAdapter;
  });

  it('asks for the profile by username, URL-encoded, and returns it', async () => {
    const calls: Array<{ url?: string; method?: string }> = [];
    client.defaults.adapter = async (config) => {
      calls.push({ url: config.url, method: config.method });
      return {
        data: { id: 'p1', username: 'a b', displayName: 'a b', skills: [] },
        status: 200,
        statusText: '',
        headers: {},
        config,
      };
    };

    const result = await profileApi.getPublicProfile('a b');

    expect(calls).toEqual([{ url: '/profile/users/a%20b', method: 'get' }]);
    expect(result.data?.displayName).toBe('a b');
  });

  it('lets the page tell "no such user" (404) from other failures', async () => {
    client.defaults.adapter = async (config) =>
      Promise.reject(
        Object.assign(new Error('Not found'), {
          isAxiosError: true,
          config,
          response: { status: 404, data: 'Profile not found', headers: {}, statusText: '', config },
        })
      );

    await expect(profileApi.getPublicProfile('ghost')).rejects.toMatchObject({ status: 404 });
  });
});
