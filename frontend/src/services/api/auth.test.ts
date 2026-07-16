import { AxiosInstance } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { authApi } from './auth';

const client = (authApi as unknown as { client: AxiosInstance }).client;
const originalAdapter = client.defaults.adapter;

describe('authApi.resendRegistrationOtp', () => {
  afterEach(() => {
    client.defaults.adapter = originalAdapter;
  });

  it('posts only the e-mail address to the resend endpoint and returns the generic message', async () => {
    const calls: Array<{ url?: string; method?: string; data?: unknown }> = [];
    client.defaults.adapter = async (config) => {
      calls.push({ url: config.url, method: config.method, data: config.data });
      return {
        data: { message: 'If that address has a pending registration, a new code was sent' },
        status: 200,
        statusText: '',
        headers: {},
        config,
      };
    };

    const result = await authApi.resendRegistrationOtp({ email: 'a@b.co' });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/auth/resend-registration-otp');
    expect(calls[0].method).toBe('post');
    expect(JSON.parse(String(calls[0].data))).toEqual({ email: 'a@b.co' });
    expect(result.success).toBe(true);
  });
});
