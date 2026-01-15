import { BaseApi, ApiResponse } from './base';

// Request-related interfaces matching backend DTOs
export interface JoinRequest {
  id: number;
  projectId: string;
  projectTitle: string;
  requester: {
    id: string;
    username: string;
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

  async getReceivedRequests(
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<ApiResponse<JoinRequest[]>> {
    const params = status ? `?status=${status}` : '';
    const response = await this.get<{ data: JoinRequest[]; count: number }>(
      `/requests/received${params}`
    );

    // Extract data from nested response
    return {
      success: response.success,
      data: response.data?.data || [],
      message: response.message,
    };
  }

  async getSentRequests(
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<ApiResponse<JoinRequest[]>> {
    const params = status ? `?status=${status}` : '';
    const response = await this.get<{ data: JoinRequest[]; count: number }>(
      `/requests/sent${params}`
    );

    // Extract data from nested response
    return {
      success: response.success,
      data: response.data?.data || [],
      message: response.message,
    };
  }

  async getRequestById(requestId: number): Promise<ApiResponse<JoinRequest>> {
    const response = await this.get<{ data: JoinRequest }>(
      `/requests/${requestId}`
    );

    return {
      success: response.success,
      data: response.data?.data,
      message: response.message,
    };
  }

  async approveRequest(requestId: number): Promise<ApiResponse<JoinRequest>> {
    const response = await this.post<{ data: JoinRequest }>(
      `/requests/${requestId}/approve`,
      {}
    );

    return {
      success: response.success,
      data: response.data?.data,
      message: response.message || 'Request approved successfully',
    };
  }

  async rejectRequest(
    requestId: number,
    data?: RespondToRequestData
  ): Promise<ApiResponse<JoinRequest>> {
    const response = await this.post<{ data: JoinRequest }>(
      `/requests/${requestId}/reject`,
      data || {}
    );

    return {
      success: response.success,
      data: response.data?.data,
      message: response.message || 'Request rejected successfully',
    };
  }

  async cancelRequest(
    requestId: number
  ): Promise<ApiResponse<{ message: string }>> {
    return this.delete<{ message: string }>(`/requests/${requestId}`);
  }

  async getRequestStats(): Promise<ApiResponse<RequestStats>> {
    const response = await this.get<{ data: RequestStats }>('/requests/stats');

    return {
      success: response.success,
      data: response.data?.data,
      message: response.message,
    };
  }
}

export const requestsApi = new RequestsApi();
