import { BaseApi, ApiResponse } from './base';

// Fired after anything that changes the number of pending requests (approve, decline, withdraw), so the sidebar
// badge can refresh without waiting for its timer
export const REQUESTS_CHANGED_EVENT = 'requests:changed';

// Request-related interfaces matching backend DTOs
export interface JoinRequest {
  id: number;
  projectId: string;
  projectTitle: string;
  /** Who owns the project, i.e. who decides on the request. */
  ownerUsername?: string;
  ownerDisplayName?: string;
  requester: {
    id: string;
    username: string;
    displayName?: string;
    firstname: string;
    lastname: string;
    profilePictureUrl: string;
    skills: string[];
  };
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ON_HOLD';
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

export interface RequestStats {
  pendingReceived: number;
  pendingSent: number;
  totalReceived: number;
  totalSent: number;
  approvedReceived: number;
  rejectedReceived: number;
}

export interface SendJoinRequestData {
  message?: string;
}

export interface RespondToRequestData {
  reason?: string;
}

class RequestsApi extends BaseApi {
  async sendJoinRequest(
    projectId: string,
    data?: SendJoinRequestData
  ): Promise<ApiResponse<{ requestId: number }>> {
    return this.post<{ requestId: number }>(
      `/requests/join/${projectId}`,
      data || {}
    );
  }

  // The shared client already unwraps the server's { success, data, count } envelope, so `data` is the list itself
  async getReceivedRequests(
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<ApiResponse<JoinRequest[]>> {
    return this.getAll<JoinRequest>('/requests/received', {
      params: status ? { status } : undefined,
    });
  }

  async getSentRequests(
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<ApiResponse<JoinRequest[]>> {
    return this.getAll<JoinRequest>('/requests/sent', {
      params: status ? { status } : undefined,
    });
  }

  async getRequestById(requestId: number): Promise<ApiResponse<JoinRequest>> {
    return this.get<JoinRequest>(`/requests/${requestId}`);
  }

  async approveRequest(requestId: number): Promise<ApiResponse<JoinRequest>> {
    return this.post<JoinRequest>(`/requests/${requestId}/approve`, {});
  }

  async rejectRequest(
    requestId: number,
    data?: RespondToRequestData
  ): Promise<ApiResponse<JoinRequest>> {
    return this.post<JoinRequest>(`/requests/${requestId}/reject`, data || {});
  }

  async cancelRequest(
    requestId: number
  ): Promise<ApiResponse<{ message: string }>> {
    return this.delete<{ message: string }>(`/requests/${requestId}`);
  }

  async getRequestStats(): Promise<ApiResponse<RequestStats>> {
    return this.get<RequestStats>('/requests/stats');
  }
}

export const requestsApi = new RequestsApi();
