import { BaseApi, ApiResponse } from './base';

// Request-related interfaces
export interface JoinRequest {
  id: string;
  projectId: string;
  projectTitle: string;
  applicant: {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    profilePictureUrl: string;
    rating: number;
    skills: string[];
  };
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface TeamInvitation {
  id: string;
  projectId: string;
  projectTitle: string;
  inviter: {
    id: string;
    username: string;
    profilePictureUrl: string;
  };
  invitee: {
    id: string;
    username: string;
    profilePictureUrl: string;
  };
  role: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface SendJoinRequestData {
  projectId: string;
  message?: string;
}

export interface SendInvitationData {
  projectId: string;
  userId: string;
  role: string;
  message?: string;
}

export interface RespondToRequestData {
  requestId: string;
  action: 'approve' | 'reject';
  message?: string;
}

export interface RespondToInvitationData {
  invitationId: string;
  action: 'accept' | 'decline';
}

// Mock data for development
const mockJoinRequests: JoinRequest[] = [
  {
    id: "1",
    projectId: "1",
    projectTitle: "Modern E-commerce Platform",
    applicant: {
      id: "5",
      username: "sarah_dev",
      firstname: "Sarah",
      lastname: "Johnson",
      profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
      rating: 4.5,
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Redis"],
    },
    message: "I'm excited to contribute to this project! I have 3 years of experience with React and Node.js.",
    status: "pending",
    createdAt: "2024-01-20T10:30:00Z",
    updatedAt: "2024-01-20T10:30:00Z",
  },
  {
    id: "2",
    projectId: "2",
    projectTitle: "AI-Powered Analytics Dashboard",
    applicant: {
      id: "6",
      username: "alex_coder",
      firstname: "Alex",
      lastname: "Rodriguez",
      profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
      rating: 4.8,
      skills: ["Python", "TensorFlow", "React", "D3.js"],
    },
    message: "I have extensive experience in ML and data visualization. Would love to join this innovative project!",
    status: "pending",
    createdAt: "2024-01-18T14:20:00Z",
    updatedAt: "2024-01-18T14:20:00Z",
  },
  {
    id: "3",
    projectId: "1",
    projectTitle: "Modern E-commerce Platform",
    applicant: {
      id: "7",
      username: "mike_frontend",
      firstname: "Mike",
      lastname: "Chen",
      profilePictureUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
      rating: 4.2,
      skills: ["React", "Vue.js", "CSS", "JavaScript"],
    },
    message: "Frontend specialist here! I can help create an amazing user experience.",
    status: "approved",
    createdAt: "2024-01-15T09:15:00Z",
    updatedAt: "2024-01-16T11:30:00Z",
  },
];

const mockInvitations: TeamInvitation[] = [
  {
    id: "1",
    projectId: "1",
    projectTitle: "Modern E-commerce Platform",
    inviter: {
      id: "1",
      username: "project_owner",
      profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    invitee: {
      id: "8",
      username: "emma_backend",
      profilePictureUrl: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    role: "Backend Developer",
    message: "We'd love to have you join our team as a backend developer!",
    status: "pending",
    createdAt: "2024-01-19T16:45:00Z",
    updatedAt: "2024-01-19T16:45:00Z",
  },
];

class RequestsApi extends BaseApi {
  // Get join requests for user's projects
  async getJoinRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<ApiResponse<JoinRequest[]>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const params = status ? `?status=${status}` : '';
      return this.get<JoinRequest[]>(`/requests/join${params}`);
    }

    let filteredRequests = [...mockJoinRequests];

    if (status) {
      filteredRequests = filteredRequests.filter(request => request.status === status);
    }

    return {
      success: true,
      data: filteredRequests,
      message: "Join requests retrieved successfully",
    };
  }

  // Get team invitations for current user
  async getTeamInvitations(status?: 'pending' | 'accepted' | 'declined'): Promise<ApiResponse<TeamInvitation[]>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const params = status ? `?status=${status}` : '';
      return this.get<TeamInvitation[]>(`/requests/invitations${params}`);
    }

    let filteredInvitations = [...mockInvitations];

    if (status) {
      filteredInvitations = filteredInvitations.filter(invitation => invitation.status === status);
    }

    return {
      success: true,
      data: filteredInvitations,
      message: "Team invitations retrieved successfully",
    };
  }

  // Send join request
  async sendJoinRequest(data: SendJoinRequestData): Promise<ApiResponse<JoinRequest>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<JoinRequest>('/requests/join', data);
    }

    // Mock validation - check if already requested
    const existingRequest = mockJoinRequests.find(
      req => req.projectId === data.projectId && req.applicant.id === "1" && req.status === 'pending'
    );

    if (existingRequest) {
      throw {
        message: "You have already sent a request for this project",
        status: 409,
      };
    }

    const newRequest: JoinRequest = {
      id: Date.now().toString(),
      projectId: data.projectId,
      projectTitle: "Sample Project",
      applicant: {
        id: "1",
        username: "johndoe",
        firstname: "John",
        lastname: "Doe",
        profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
        rating: 4.5,
        skills: ["React", "Node.js", "TypeScript"],
      },
      message: data.message || "I'm interested in joining this project!",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: newRequest,
      message: "Join request sent successfully",
    };
  }

  // Send team invitation
  async sendTeamInvitation(data: SendInvitationData): Promise<ApiResponse<TeamInvitation>> {
    await this.simulateDelay(700);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<TeamInvitation>('/requests/invite', data);
    }

    const newInvitation: TeamInvitation = {
      id: Date.now().toString(),
      projectId: data.projectId,
      projectTitle: "Sample Project",
      inviter: {
        id: "1",
        username: "johndoe",
        profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
      },
      invitee: {
        id: data.userId,
        username: "invited_user",
        profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
      },
      role: data.role,
      message: data.message || "You're invited to join our team!",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: newInvitation,
      message: "Team invitation sent successfully",
    };
  }

  // Respond to join request (approve/reject)
  async respondToJoinRequest(data: RespondToRequestData): Promise<ApiResponse<JoinRequest>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<JoinRequest>(`/requests/join/${data.requestId}/respond`, {
        action: data.action,
        message: data.message,
      });
    }

    const request = mockJoinRequests.find(req => req.id === data.requestId);
    if (!request) {
      throw {
        message: "Join request not found",
        status: 404,
      };
    }

    const updatedRequest: JoinRequest = {
      ...request,
      status: data.action === 'approve' ? 'approved' : 'rejected',
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedRequest,
      message: `Join request ${data.action === 'approve' ? 'approved' : 'rejected'} successfully`,
    };
  }

  // Respond to team invitation (accept/decline)
  async respondToTeamInvitation(data: RespondToInvitationData): Promise<ApiResponse<TeamInvitation>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<TeamInvitation>(`/requests/invitations/${data.invitationId}/respond`, {
        action: data.action,
      });
    }

    const invitation = mockInvitations.find(inv => inv.id === data.invitationId);
    if (!invitation) {
      throw {
        message: "Team invitation not found",
        status: 404,
      };
    }

    const updatedInvitation: TeamInvitation = {
      ...invitation,
      status: data.action === 'accept' ? 'accepted' : 'declined',
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedInvitation,
      message: `Team invitation ${data.action === 'accept' ? 'accepted' : 'declined'} successfully`,
    };
  }

  // Cancel join request
  async cancelJoinRequest(requestId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/requests/join/${requestId}`);
    }

    return {
      success: true,
      data: { message: "Join request cancelled successfully" },
      message: "Your join request has been cancelled",
    };
  }

  // Cancel team invitation
  async cancelTeamInvitation(invitationId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/requests/invitations/${invitationId}`);
    }

    return {
      success: true,
      data: { message: "Team invitation cancelled successfully" },
      message: "Team invitation has been cancelled",
    };
  }

  // Get request statistics
  async getRequestStats(): Promise<ApiResponse<{
    pendingJoinRequests: number;
    pendingInvitations: number;
    totalJoinRequests: number;
    totalInvitations: number;
  }>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<{
        pendingJoinRequests: number;
        pendingInvitations: number;
        totalJoinRequests: number;
        totalInvitations: number;
      }>('/requests/stats');
    }

    const stats = {
      pendingJoinRequests: mockJoinRequests.filter(req => req.status === 'pending').length,
      pendingInvitations: mockInvitations.filter(inv => inv.status === 'pending').length,
      totalJoinRequests: mockJoinRequests.length,
      totalInvitations: mockInvitations.length,
    };

    return {
      success: true,
      data: stats,
      message: "Request statistics retrieved successfully",
    };
  }
}

export const requestsApi = new RequestsApi();