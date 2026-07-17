import { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { requestsApi } from './requests';
import { projectsApi } from './projects';

// All the BaseApi subclasses share one axios instance
const client = (requestsApi as unknown as { client: AxiosInstance }).client;
const originalAdapter = client.defaults.adapter;

interface Call {
  url?: string;
  params: Record<string, unknown>;
}

// A fake server holding `total` numbered rows that honours page/size like the real list endpoints
function serve(total: number, wrap: (rows: number[], count: number) => unknown, sendTotalHeader = true) {
  const calls: Call[] = [];
  client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const params = (config.params ?? {}) as Record<string, number | string>;
    calls.push({ url: config.url, params });
    const page = Number(params.page ?? 0);
    const size = Number(params.size ?? 200);
    const rows = Array.from({ length: total }, (_, i) => i).slice(page * size, page * size + size);
    return {
      data: wrap(rows, total),
      status: 200,
      statusText: '',
      headers: sendTotalHeader ? { 'x-total-count': String(total) } : {},
      config,
    };
  };
  return calls;
}

describe('paged list calls', () => {
  afterEach(() => {
    client.defaults.adapter = originalAdapter;
  });

  it('walks every page and returns one plain array, in order', async () => {
    const calls = serve(250, (rows) => rows);

    const result = await projectsApi.getJoinedProjects();

    expect(calls.map((c) => c.params.page)).toEqual([0, 1, 2]);
    expect(calls.every((c) => c.params.size === 100)).toBe(true);
    expect(result.data).toHaveLength(250);
    expect(result.data).toEqual(Array.from({ length: 250 }, (_, i) => i));
    expect(result.meta?.total).toBe(250);
  });

  it('stops after one request when everything fits on the first page', async () => {
    const calls = serve(7, (rows) => rows);

    const result = await projectsApi.getJoinedProjects();

    expect(calls).toHaveLength(1);
    expect(result.data).toHaveLength(7);
  });

  it('does not ask for an extra, empty page when the last page is exactly full', async () => {
    const calls = serve(200, (rows) => rows);

    const result = await projectsApi.getProjectTasks('p1');

    expect(calls.map((c) => c.params.page)).toEqual([0, 1]);
    expect(result.data).toHaveLength(200);
  });

  it('still stops on a short page when the server sends no total', async () => {
    const calls = serve(130, (rows) => rows, false);

    const result = await projectsApi.getProjectFiles('p1');

    expect(calls.map((c) => c.params.page)).toEqual([0, 1]);
    expect(result.data).toHaveLength(130);
  });

  it('keeps the caller’s own parameters on every page and unwraps the requests envelope', async () => {
    const calls = serve(120, (rows, count) => ({ success: true, data: rows, count: rows.length, total: count }));

    const result = await requestsApi.getReceivedRequests('PENDING');

    expect(calls.map((c) => c.url)).toEqual(['/requests/received', '/requests/received']);
    expect(calls.every((c) => c.params.status === 'PENDING')).toBe(true);
    expect(result.data).toHaveLength(120);
  });

  it('gives up after a bounded number of pages instead of looping on a server that never ends', async () => {
    // claims an endless list: always a full page, no total
    const calls: Call[] = [];
    client.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      calls.push({ url: config.url, params: (config.params ?? {}) as Record<string, unknown> });
      return { data: Array.from({ length: 100 }, (_, i) => i), status: 200, statusText: '', headers: {}, config };
    };

    await projectsApi.getJoinedProjects();

    expect(calls.length).toBeLessThanOrEqual(100);
  });

  it('turns a failing page into the usual API error', async () => {
    client.defaults.adapter = async (config: InternalAxiosRequestConfig) =>
      Promise.reject(Object.assign(new Error('boom'), { isAxiosError: true, config, response: { status: 500, data: 'broken', headers: {}, statusText: '', config } }));

    await expect(projectsApi.getJoinedProjects()).rejects.toMatchObject({ message: expect.any(String) });
  });
});
