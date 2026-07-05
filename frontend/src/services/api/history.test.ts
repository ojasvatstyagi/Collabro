import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { historyApi, HistoryPage, HistoryStats } from './history';

const client = (historyApi as unknown as { client: AxiosInstance }).client;

let requests: InternalAxiosRequestConfig[] = [];

const mockServer = (status: number, data: unknown) => {
  requests = [];
  client.defaults.adapter = async (config) => {
    requests.push(config);
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      throw new AxiosError('request failed', String(status), config, null, response);
    }
    return response;
  };
};

const page: HistoryPage = {
  content: [
    {
      id: 'project:1',
      type: 'project',
      title: 'Created project',
      description: null,
      timestamp: '2026-11-20T10:30:00',
      status: 'ongoing',
      projectId: 'p1',
      projectName: 'Alpha',
      relatedUsername: null,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 50,
  first: true,
  last: true,
};

describe('historyApi.getHistory', () => {
  beforeEach(() => mockServer(200, page));

  it('sends no params when no filters are set', async () => {
    await historyApi.getHistory();

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('/history');
    expect(requests[0].params).toEqual({});
  });

  it('omits empty filters but keeps page 0', async () => {
    await historyApi.getHistory({ type: undefined, timeframe: undefined, search: '  ', page: 0 });

    expect(requests[0].params).toEqual({ page: 0 });
  });

  it('passes every filter, page and size', async () => {
    await historyApi.getHistory({
      type: 'task',
      timeframe: 'month',
      search: ' api ',
      page: 2,
      size: 20,
    });

    expect(requests[0].params).toEqual({
      type: 'task',
      timeframe: 'month',
      search: 'api',
      page: 2,
      size: 20,
    });
  });

  it('returns the page as-is', async () => {
    const response = await historyApi.getHistory();

    expect(response.success).toBe(true);
    expect(response.data).toEqual(page);
  });

  it('throws an ApiError on failure', async () => {
    mockServer(400, { message: 'Invalid type' });

    await expect(historyApi.getHistory({ page: 0 })).rejects.toMatchObject({
      message: 'Invalid type',
      status: 400,
    });
  });
});

describe('historyApi.getStats', () => {
  it('requests /history/stats and returns the stats as-is', async () => {
    const stats: HistoryStats = {
      totalActivities: 10,
      projectsCreated: 2,
      collaborationsJoined: 3,
      tasksCompleted: 4,
      thisWeek: 5,
      thisMonth: 6,
    };
    mockServer(200, stats);

    const response = await historyApi.getStats();

    expect(requests[0].url).toBe('/history/stats');
    expect(response.data).toEqual(stats);
  });
});
