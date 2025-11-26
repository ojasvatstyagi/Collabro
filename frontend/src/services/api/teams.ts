import { BaseApi, ApiResponse } from './base';

// Team-related interfaces
export interface TeamMember {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  profilePictureUrl: string;
  role: 'owner' | 'admin' | 'member';
  status: 'online' | 'away' | 'offline';
  joinedAt: string;
  skills: string[];
  contribution: number; // percentage
  lastActive?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  visibility: 'public' | 'private' | 'invite-only';
  memberCount: number;
  maxMembers: number;
  members: TeamMember[];
  owner: TeamMember;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  rating: number;
  projectsCompleted: number;
  currentProjects: number;
  achievements: string[];
  location?: string;
  isRemote: boolean;
  requirements: string[];
  benefits: string[];
  applicationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  inviteCode?: string;
}

export interface CreateTeamRequest {
  name: string;
  description: string;
  category: string;
  tags: string[];
  visibility: 'public' | 'private' | 'invite-only';
  maxMembers: number;
  location?: string;
  isRemote: boolean;
  requirements: string[];
  benefits: string[];
}

export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {
  isActive?: boolean;
}

export interface TeamFilters {
  category?: string;
  visibility?: string;
  isRemote?: boolean;
  hasOpenings?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface JoinTeamRequest {
  message?: string;
}

export interface InviteToTeamRequest {
  userId: string;
  role: 'admin' | 'member';
  message?: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
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
  role: 'admin' | 'member';
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface TeamApplication {
  id: string;
  teamId: string;
  teamName: string;
  applicant: {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    profilePictureUrl: string;
    skills: string[];
  };
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Mock data for development
const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    username: "sarah_ui",
    firstname: "Sarah",
    lastname: "Johnson",
    profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    role: "owner",
    status: "online",
    joinedAt: "2024-01-01T00:00:00Z",
    skills: ["React", "TypeScript", "Figma"],
    contribution: 95,
  },
  {
    id: "2",
    username: "mike_react",
    firstname: "Mike",
    lastname: "Chen",
    profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
    role: "admin",
    status: "online",
    joinedAt: "2024-01-05T00:00:00Z",
    skills: ["React", "Next.js", "CSS"],
    contribution: 88,
  },
];

const mockTeams: Team[] = [
  {
    id: "1",
    name: "Frontend Innovators",
    description: "A team of passionate frontend developers focused on creating cutting-edge user interfaces and experiences using modern technologies.",
    category: "Web Development",
    tags: ["React", "TypeScript", "UI/UX", "Modern Web"],
    visibility: "public",
    memberCount: 8,
    maxMembers: 12,
    members: mockTeamMembers,
    owner: mockTeamMembers[0],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
    isActive: true,
    rating: 4.8,
    projectsCompleted: 12,
    currentProjects: 3,
    achievements: ["Top Performer", "Innovation Award"],
    isRemote: true,
    requirements: ["2+ years React experience", "Strong CSS skills", "Team player"],
    benefits: ["Flexible hours", "Learning opportunities", "Mentorship"],
    applicationStatus: "none",
  },
  {
    id: "2",
    name: "AI Research Collective",
    description: "Cutting-edge AI research team working on machine learning models and data science projects with real-world applications.",
    category: "AI/Machine Learning",
    tags: ["Python", "TensorFlow", "Research", "Data Science"],
    visibility: "invite-only",
    memberCount: 6,
    maxMembers: 10,
    members: [mockTeamMembers[0]],
    owner: mockTeamMembers[0],
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-22T00:00:00Z",
    isActive: true,
    rating: 4.9,
    projectsCompleted: 8,
    currentProjects: 2,
    achievements: ["Research Excellence", "Innovation Leader"],
    isRemote: true,
    requirements: ["PhD in AI/ML or equivalent", "Published research", "Python expertise"],
    benefits: ["Research funding", "Conference attendance", "Publication opportunities"],
    applicationStatus: "pending",
  },
];

class TeamsApi extends BaseApi {
  // Get all teams with filters
  async getTeams(filters?: TeamFilters): Promise<ApiResponse<Team[]>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      return this.get<Team[]>(`/teams?${params.toString()}`);
    }

    // Mock filtering
    let filteredTeams = [...mockTeams];

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredTeams = filteredTeams.filter(team =>
        team.name.toLowerCase().includes(search) ||
        team.description.toLowerCase().includes(search) ||
        team.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (filters?.category && filters.category !== 'All Teams') {
      filteredTeams = filteredTeams.filter(team => team.category === filters.category);
    }

    if (filters?.visibility && filters.visibility !== 'all') {
      filteredTeams = filteredTeams.filter(team => team.visibility === filters.visibility);
    }

    if (filters?.hasOpenings) {
      filteredTeams = filteredTeams.filter(team => team.memberCount < team.maxMembers);
    }

    return {
      success: true,
      data: filteredTeams,
      message: "Teams retrieved successfully",
      meta: {
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        total: filteredTeams.length,
        totalPages: Math.ceil(filteredTeams.length / (filters?.limit || 10)),
      },
    };
  }

  // Get team by ID
  async getTeamById(teamId: string): Promise<ApiResponse<Team>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<Team>(`/teams/${teamId}`);
    }

    const team = mockTeams.find(t => t.id === teamId);
    if (!team) {
      throw {
        message: "Team not found",
        status: 404,
      };
    }

    return {
      success: true,
      data: team,
      message: "Team retrieved successfully",
    };
  }

  // Get user's teams
  async getUserTeams(): Promise<ApiResponse<Team[]>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<Team[]>('/teams/me');
    }

    return {
      success: true,
      data: mockTeams,
      message: "User teams retrieved successfully",
    };
  }

  // Create new team
  async createTeam(data: CreateTeamRequest): Promise<ApiResponse<Team>> {
    await this.simulateDelay(1000);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<Team>('/teams', data);
    }

    const newTeam: Team = {
      id: Date.now().toString(),
      ...data,
      memberCount: 1,
      members: [mockTeamMembers[0]],
      owner: mockTeamMembers[0],
      isActive: true,
      rating: 0,
      projectsCompleted: 0,
      currentProjects: 0,
      achievements: [],
      applicationStatus: "none",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: newTeam,
      message: "Team created successfully",
    };
  }

  // Update team
  async updateTeam(teamId: string, data: UpdateTeamRequest): Promise<ApiResponse<Team>> {
    await this.simulateDelay(800);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<Team>(`/teams/${teamId}`, data);
    }

    const team = mockTeams.find(t => t.id === teamId);
    if (!team) {
      throw {
        message: "Team not found",
        status: 404,
      };
    }

    const updatedTeam: Team = {
      ...team,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedTeam,
      message: "Team updated successfully",
    };
  }

  // Delete team
  async deleteTeam(teamId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/teams/${teamId}`);
    }

    return {
      success: true,
      data: { message: "Team deleted successfully" },
      message: "Team has been deleted",
    };
  }

  // Join team
  async joinTeam(teamId: string, request?: JoinTeamRequest): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(700);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string }>(`/teams/${teamId}/join`, request);
    }

    return {
      success: true,
      data: { message: "Join request sent successfully" },
      message: "Your request to join the team has been sent",
    };
  }

  // Leave team
  async leaveTeam(teamId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string }>(`/teams/${teamId}/leave`);
    }

    return {
      success: true,
      data: { message: "Left team successfully" },
      message: "You have left the team",
    };
  }

  // Invite user to team
  async inviteToTeam(teamId: string, request: InviteToTeamRequest): Promise<ApiResponse<TeamInvitation>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<TeamInvitation>(`/teams/${teamId}/invite`, request);
    }

    const invitation: TeamInvitation = {
      id: Date.now().toString(),
      teamId,
      teamName: "Sample Team",
      inviter: {
        id: "1",
        username: "johndoe",
        profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
      },
      invitee: {
        id: request.userId,
        username: "invited_user",
        profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
      },
      role: request.role,
      message: request.message || "You're invited to join our team!",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: invitation,
      message: "Team invitation sent successfully",
    };
  }

  // Get team applications
  async getTeamApplications(teamId: string): Promise<ApiResponse<TeamApplication[]>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<TeamApplication[]>(`/teams/${teamId}/applications`);
    }

    const mockApplications: TeamApplication[] = [
      {
        id: "1",
        teamId,
        teamName: "Sample Team",
        applicant: {
          id: "5",
          username: "new_developer",
          firstname: "John",
          lastname: "Smith",
          profilePictureUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
          skills: ["React", "Node.js", "TypeScript"],
        },
        message: "I'm excited to join your team and contribute to amazing projects!",
        status: "pending",
        createdAt: "2024-01-20T10:30:00Z",
        updatedAt: "2024-01-20T10:30:00Z",
      },
    ];

    return {
      success: true,
      data: mockApplications,
      message: "Team applications retrieved successfully",
    };
  }

  // Respond to team application
  async respondToApplication(teamId: string, applicationId: string, action: 'approve' | 'reject'): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<{ message: string }>(`/teams/${teamId}/applications/${applicationId}`, { action });
    }

    return {
      success: true,
      data: { message: `Application ${action}d successfully` },
      message: `Team application has been ${action}d`,
    };
  }

  // Update team member role
  async updateMemberRole(teamId: string, memberId: string, role: 'admin' | 'member'): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<{ message: string }>(`/teams/${teamId}/members/${memberId}/role`, { role });
    }

    return {
      success: true,
      data: { message: "Member role updated successfully" },
      message: "Team member role has been updated",
    };
  }

  // Remove team member
  async removeMember(teamId: string, memberId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/teams/${teamId}/members/${memberId}`);
    }

    return {
      success: true,
      data: { message: "Member removed successfully" },
      message: "Team member has been removed",
    };
  }

  // Get team categories
  async getTeamCategories(): Promise<ApiResponse<string[]>> {
    await this.simulateDelay(200);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<string[]>('/teams/categories');
    }

    const categories = [
      "Web Development",
      "Mobile Development",
      "AI/Machine Learning",
      "Data Science",
      "Backend Development",
      "DevOps",
      "UI/UX Design",
      "Game Development",
      "Blockchain",
      "Cybersecurity",
      "Cloud Computing",
      "Quality Assurance",
    ];

    return {
      success: true,
      data: categories,
      message: "Team categories retrieved successfully",
    };
  }

  // Generate team invite code
  async generateInviteCode(teamId: string): Promise<ApiResponse<{ inviteCode: string }>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ inviteCode: string }>(`/teams/${teamId}/invite-code`);
    }

    const inviteCode = Math.random().toString(36).substring(2, 15);

    return {
      success: true,
      data: { inviteCode },
      message: "Invite code generated successfully",
    };
  }

  // Join team by invite code
  async joinByInviteCode(inviteCode: string): Promise<ApiResponse<{ message: string; teamId: string }>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string; teamId: string }>('/teams/join-by-code', { inviteCode });
    }

    return {
      success: true,
      data: {
        message: "Successfully joined team",
        teamId: "1",
      },
      message: "You have joined the team successfully",
    };
  }
}

export const teamsApi = new TeamsApi();