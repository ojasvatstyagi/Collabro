import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import { requestsApi } from './requests';

const client = (requestsApi as unknown as { client: AxiosInstance }).client;

/** Answers every request with the envelope the backend's RequestController really sends. */
const serverReturns = (status: number, body: unknown) => {
  const calls: InternalAxiosRequestConfig[] = [];
  client.defaults.adapter = async (config) => {
    calls.push(config);
    const response = { data: body, status, statusText: '', headers: {}, config };
    if (status >= 400) throw new AxiosError('failed', String(status), config, null, response);
    return response;
  };
  return calls;
};

const joinRequest = { id: 4, projectId: 'p1', projectTitle: 'Probe', status: 'PENDING' };

describe('requestsApi unwraps the { success, data, count } envelope exactly once', () => {
  afterEach(() => {
    client.defaults.adapter = undefined;
  });

  it('getReceivedRequests returns the list itself (it used to always come back empty)', async () => {
    const calls = serverReturns(200, { success: true, data: [joinRequest], count: 1 });

    const response = await requestsApi.getReceivedRequests('PENDING');

    expect(response.data).toEqual([joinRequest]);
    expect(calls[0].url).toBe('/requests/received');
    expect(calls[0].params).toMatchObject({ status: 'PENDING' });
  });

  it('omits the status parameter when asking for everything', async () => {
    const calls = serverReturns(200, { success: true, data: [], count: 0 });

    const response = await requestsApi.getReceivedRequests();

    expect(response.data).toEqual([]);
    expect(calls[0].params).not.toHaveProperty('status');
  });

  it('getSentRequests returns the list itself', async () => {
    serverReturns(200, { success: true, data: [joinRequest], count: 1 });

    expect((await requestsApi.getSentRequests()).data).toEqual([joinRequest]);
  });

  it('approve and reject return the updated request', async () => {
    const calls = serverReturns(200, { success: true, message: 'ok', data: { ...joinRequest, status: 'APPROVED' } });

    expect((await requestsApi.approveRequest(4)).data).toMatchObject({ id: 4, status: 'APPROVED' });
    expect((await requestsApi.rejectRequest(4, { reason: 'full' })).data).toMatchObject({ id: 4 });
    expect(calls.map((c) => c.url)).toEqual(['/requests/4/approve', '/requests/4/reject']);
  });

  it('getRequestById and getRequestStats return their payloads', async () => {
    serverReturns(200, { success: true, data: { pendingReceived: 2, totalReceived: 3 } });
    expect((await requestsApi.getRequestStats()).data).toMatchObject({ pendingReceived: 2 });

    serverReturns(200, { success: true, data: joinRequest });
    expect((await requestsApi.getRequestById(4)).data).toEqual(joinRequest);
  });

  it('surfaces the backend message when a request is refused', async () => {
    serverReturns(403, 'Only the project owner can approve requests');

    await expect(requestsApi.approveRequest(4)).rejects.toMatchObject({
      message: 'Only the project owner can approve requests',
      status: 403,
    });
  });
});
