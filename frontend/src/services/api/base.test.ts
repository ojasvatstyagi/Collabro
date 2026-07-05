import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenService } from '../tokenService';
import { authApi } from './auth';
import { projectsApi } from './projects';
import { SESSION_EXPIRED_EVENT } from './base';

// The shared axios instance behind every API module (protected in BaseApi, so reach in for the test)
const client = (authApi as unknown as { client: AxiosInstance }).client;

type Handler = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown };

/** Replaces the network: every request goes through `handler`, 4xx/5xx are rejected like real axios does. */
const mockServer = (handler: Handler) => {
  const calls: Array<{ url?: string; auth?: string }> = [];
  client.defaults.adapter = async (config) => {
    calls.push({ url: config.url, auth: String(config.headers.Authorization) });
    const { status, data = {} } = handler(config);
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      throw new AxiosError('request failed', String(status), config, null, response);
    }
    return response;
  };
  return calls;
};

const refreshReturns = (accessToken?: string) =>
  vi
    .spyOn(axios, 'post')
    .mockResolvedValue({ data: accessToken ? { accessToken } : {} });

const refreshFails = () =>
  vi
    .spyOn(axios, 'post')
    .mockRejectedValue(new AxiosError('no refresh token', '401'));

const onlyWith = (token: string, ok: object): Handler => (config) =>
  config.headers.Authorization === `Bearer ${token}`
    ? { status: 200, data: ok }
    : { status: 401 };

describe('API client token refresh', () => {
  let sessionExpired: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tokenService.setAccessToken('expired');
    sessionExpired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, sessionExpired);
  });

  afterEach(() => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, sessionExpired);
    vi.restoreAllMocks();
    tokenService.clearAccessToken();
  });

  it('refreshes an expired token for /auth/me and retries it (the reload-logs-you-out bug)', async () => {
    const calls = mockServer(onlyWith('fresh', { user: { id: 'u1' } }));
    const refresh = refreshReturns('fresh');

    const response = await authApi.getCurrentUser();

    expect(response.data?.user.id).toBe('u1');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh.mock.calls[0][0]).toBe('/api/auth/refresh');
    expect(tokenService.getAccessToken()).toBe('fresh');
    expect(calls).toHaveLength(2);
    expect(sessionExpired).not.toHaveBeenCalled();
  });

  it('shares one refresh between requests that fail at the same time', async () => {
    mockServer(onlyWith('fresh', { ok: true }));
    const refresh = vi.spyOn(axios, 'post').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { accessToken: 'fresh' } }), 20))
    );

    const [a, b, c] = await Promise.all([
      authApi.getCurrentUser(),
      authApi.getCurrentUser(),
      authApi.getCurrentUser(),
    ]);

    expect([a.success, b.success, c.success]).toEqual([true, true, true]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('ends the session without a page reload when the refresh fails', async () => {
    mockServer(() => ({ status: 401 }));
    refreshFails();
    const hrefBefore = window.location.href;

    await expect(authApi.getCurrentUser()).rejects.toBeDefined();

    expect(tokenService.getAccessToken()).toBeNull();
    expect(sessionExpired).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(hrefBefore);
  });

  it('treats a refresh response without a token as a failed refresh', async () => {
    mockServer(() => ({ status: 401 }));
    refreshReturns(undefined);

    await expect(authApi.getCurrentUser()).rejects.toBeDefined();

    expect(sessionExpired).toHaveBeenCalledTimes(1);
  });

  it('retries a request only once, so a persistent 401 cannot loop', async () => {
    const calls = mockServer(() => ({ status: 401 }));
    const refresh = refreshReturns('fresh');

    await expect(authApi.getCurrentUser()).rejects.toBeDefined();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(2);
  });

  it('does not try to refresh when logging in fails', async () => {
    mockServer(() => ({ status: 401, data: { message: 'Invalid credentials' } }));
    const refresh = refreshReturns('fresh');

    await expect(authApi.login({ username: 'a', password: 'b' })).rejects.toMatchObject({
      message: 'Invalid credentials',
    });

    expect(refresh).not.toHaveBeenCalled();
    expect(sessionExpired).not.toHaveBeenCalled();
  });

  it('leaves non-401 errors alone', async () => {
    mockServer(() => ({ status: 500 }));
    const refresh = refreshReturns('fresh');

    await expect(authApi.getCurrentUser()).rejects.toBeDefined();

    expect(refresh).not.toHaveBeenCalled();
    expect(tokenService.getAccessToken()).toBe('expired');
  });
});

describe('authApi.logout', () => {
  afterEach(() => {
    tokenService.clearAccessToken();
  });

  it('clears the stored token when the server call succeeds', async () => {
    tokenService.setAccessToken('token');
    mockServer(() => ({ status: 200, data: { message: 'Logout successful' } }));

    await authApi.logout();

    expect(tokenService.getAccessToken()).toBeNull();
  });

  it('clears the stored token even when the server call fails', async () => {
    tokenService.setAccessToken('token');
    mockServer(() => ({ status: 500 }));

    await expect(authApi.logout()).rejects.toBeDefined();

    expect(tokenService.getAccessToken()).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});

describe('authenticated downloads', () => {
  const projectsClient = (projectsApi as unknown as { client: AxiosInstance }).client;

  afterEach(() => {
    tokenService.clearAccessToken();
  });

  it('fetches the file through the shared client, with the access token', async () => {
    tokenService.setAccessToken('token');
    const calls = mockServer(() => ({ status: 200, data: new Blob(['%PDF']) }));

    const blob = await projectsApi.downloadFile('file-1');

    expect(blob).toBeInstanceOf(Blob);
    expect(calls[0].url).toBe('/project-files/file-1/download');
    expect(calls[0].auth).toBe('Bearer token');
    expect(projectsClient).toBe(client);
  });

  it("surfaces the server's message when a download is refused (error bodies arrive as blobs)", async () => {
    mockServer(() => ({
      status: 403,
      data: new Blob(['You must be a member of this project to do this']),
    }));

    await expect(projectsApi.downloadFile('file-1')).rejects.toEqual({
      message: 'You must be a member of this project to do this',
      status: 403,
    });
  });

  it('falls back to a generic message for an empty error body', async () => {
    mockServer(() => ({ status: 500, data: new Blob([]) }));

    await expect(projectsApi.downloadFile('file-1')).rejects.toMatchObject({
      message: 'An error occurred',
      status: 500,
    });
  });
});
