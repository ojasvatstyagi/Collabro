import { BaseApi, ApiResponse } from './base';

// Project-related interfaces
export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  techStack: string[];
  teamSize: {
    min: number;
    max: number;
    current: number;
  };
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  budget: 'unpaid' | 'paid' | 'equity' | 'negotiable';
  timeline: string;
  requirements: string[];
  goals: string[];
  isRemote: boolean;
  isOpenSource: boolean;
  contactMethod: 'platform' | 'email' | 'discord';
  additionalInfo: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress: number;
  owner: {
    id: string;
    username: string;
    profilePictureUrl: string;
  };
  members: TeamMember[];
  applicants: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
}

export interface TeamMember {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  profilePictureUrl: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  joinedAt: string;
  lastSeen?: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  category: string;
  techStack: string[];
  teamSize: {
    min: number;
    max: number;
  };
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  budget: 'unpaid' | 'paid' | 'equity' | 'negotiable';
  timeline: string;
  requirements: string[];
  goals: string[];
  isRemote: boolean;
  isOpenSource: boolean;
  contactMethod: 'platform' | 'email' | 'discord';
  additionalInfo: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  progress?: number;
}

export interface ProjectFilters {
  category?: string;
  difficulty?: string;
  budget?: string;
  techStack?: string[];
  isRemote?: boolean;
  isOpenSource?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface JoinProjectRequest {
  message?: string;
}

// Mock data for development
const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    username: "sarah_dev",
    firstname: "Sarah",
    lastname: "Johnson",
    profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    role: "Project Lead",
    status: "online",
    joinedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    username: "mike_frontend",
    firstname: "Mike",
    lastname: "Chen",
    profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
    role: "Frontend Developer",
    status: "online",
    joinedAt: "2024-01-16T00:00:00Z",
  },
  {
    id: "3",
    username: "alex_backend",
    firstname: "Alex",
    lastname: "Rodriguez",
    profilePictureUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
    role: "Backend Developer",
    status: "away",
    joinedAt: "2024-01-17T00:00:00Z",
    lastSeen: "2 hours ago",
  },
];

const mockProjects: Project[] = [
  {
    id: "1",
    title: "Modern E-commerce Platform",
    description: "A full-stack e-commerce solution with real-time inventory management",
    category: "Web Development",
    techStack: ["React", "Node.js", "PostgreSQL", "Redis"],
    teamSize: { min: 3, max: 5, current: 3 },
    duration: "3 months",
    difficulty: "intermediate",
    budget: "unpaid",
    timeline: "Week 1-2: Planning, Week 3-8: Development, Week 9-12: Testing",
    requirements: ["React experience", "Backend development skills"],
    goals: ["Launch MVP", "Gain 100 users"],
    isRemote: true,
    isOpenSource: false,
    contactMethod: "platform",
    additionalInfo: "Looking for passionate developers to build something amazing!",
    status: "active",
    progress: 65,
    owner: {
      id: "1",
      username: "sarah_dev",
      profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    members: mockTeamMembers,
    applicants: 12,
    rating: 4.5,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-20T00:00:00Z",
    startDate: "2024-01-15T00:00:00Z",
    endDate: "2024-04-15T00:00:00Z",
  },
  {
    id: "2",
    title: "AI-Powered Analytics Dashboard",
    description: "Data visualization platform with machine learning insights",
    category: "AI/Machine Learning",
    techStack: ["Python", "React", "TensorFlow", "D3.js"],
    teamSize: { min: 4, max: 6, current: 2 },
    duration: "4 months",
    difficulty: "advanced",
    budget: "equity",
    timeline: "Month 1: Research, Month 2-3: Development, Month 4: Testing",
    requirements: ["ML experience", "Data visualization skills"],
    goals: ["Build MVP", "Secure funding"],
    isRemote: true,
    isOpenSource: true,
    contactMethod: "platform",
    additionalInfo: "Exciting opportunity to work with cutting-edge AI technology!",
    status: "active",
    progress: 30,
    owner: {
      id: "2",
      username: "data_scientist_emma",
      profilePictureUrl: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    members: mockTeamMembers.slice(0, 2),
    applicants: 8,
    rating: 4.8,
    createdAt: "2024-01-18T00:00:00Z",
    updatedAt: "2024-01-22T00:00:00Z",
    startDate: "2024-01-18T00:00:00Z",
    endDate: "2024-05-18T00:00:00Z",
  },
];

class ProjectsApi extends BaseApi {
  // Get all projects with filters
  async getProjects(filters?: ProjectFilters): Promise<ApiResponse<Project[]>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.append(key, value.toString());
            }
          }
        });
      }
      return this.get<Project[]>(`/projects?${params.toString()}`);
    }

    // Mock filtering
    let filteredProjects = [...mockProjects];

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredProjects = filteredProjects.filter(project =>
        project.title.toLowerCase().includes(search) ||
        project.description.toLowerCase().includes(search) ||
        project.techStack.some(tech => tech.toLowerCase().includes(search))
      );
    }

    if (filters?.category && filters.category !== 'all') {
      filteredProjects = filteredProjects.filter(project => project.category === filters.category);
    }

    if (filters?.difficulty && filters.difficulty !== 'all') {
      filteredProjects = filteredProjects.filter(project => project.difficulty === filters.difficulty);
    }

    if (filters?.budget && filters.budget !== 'all') {
      filteredProjects = filteredProjects.filter(project => project.budget === filters.budget);
    }

    return {
      success: true,
      data: filteredProjects,
      message: "Projects retrieved successfully",
      meta: {
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        total: filteredProjects.length,
        totalPages: Math.ceil(filteredProjects.length / (filters?.limit || 10)),
      },
    };
  }

  // Get project by ID
  async getProjectById(projectId: string): Promise<ApiResponse<Project>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<Project>(`/projects/${projectId}`);
    }

    const project = mockProjects.find(p => p.id === projectId);
    if (!project) {
      throw {
        message: "Project not found",
        status: 404,
      };
    }

    return {
      success: true,
      data: project,
      message: "Project retrieved successfully",
    };
  }

  // Get user's projects
  async getUserProjects(userId?: string): Promise<ApiResponse<Project[]>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const endpoint = userId ? `/projects/user/${userId}` : '/projects/me';
      return this.get<Project[]>(endpoint);
    }

    return {
      success: true,
      data: mockProjects,
      message: "User projects retrieved successfully",
    };
  }

  // Create new project
  async createProject(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
    await this.simulateDelay(1000);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<Project>('/projects', data);
    }

    const newProject: Project = {
      id: Date.now().toString(),
      ...data,
      teamSize: { ...data.teamSize, current: 1 },
      status: 'active',
      progress: 0,
      owner: {
        id: "1",
        username: "johndoe",
        profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
      },
      members: [mockTeamMembers[0]],
      applicants: 0,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: newProject,
      message: "Project created successfully",
    };
  }

  // Update project
  async updateProject(projectId: string, data: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    await this.simulateDelay(800);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<Project>(`/projects/${projectId}`, data);
    }

    const project = mockProjects.find(p => p.id === projectId);
    if (!project) {
      throw {
        message: "Project not found",
        status: 404,
      };
    }

    const updatedProject: Project = {
      ...project,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedProject,
      message: "Project updated successfully",
    };
  }

  // Delete project
  async deleteProject(projectId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/projects/${projectId}`);
    }

    return {
      success: true,
      data: { message: "Project deleted successfully" },
      message: "Project has been deleted",
    };
  }

  // Join project
  async joinProject(projectId: string, request?: JoinProjectRequest): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(700);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string }>(`/projects/${projectId}/join`, request);
    }

    return {
      success: true,
      data: { message: "Join request sent successfully" },
      message: "Your request to join the project has been sent",
    };
  }

  // Leave project
  async leaveProject(projectId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string }>(`/projects/${projectId}/leave`);
    }

    return {
      success: true,
      data: { message: "Left project successfully" },
      message: "You have left the project",
    };
  }

  // Get project categories
  async getCategories(): Promise<ApiResponse<string[]>> {
    await this.simulateDelay(200);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<string[]>('/projects/categories');
    }

    const categories = [
      "Web Development",
      "Mobile App",
      "Desktop Application",
      "AI/Machine Learning",
      "Data Science",
      "Game Development",
      "Blockchain",
      "IoT",
      "DevOps",
      "UI/UX Design",
      "API Development",
      "E-commerce",
      "Social Platform",
      "Educational Tool",
      "Productivity Tool",
      "Other",
    ];

    return {
      success: true,
      data: categories,
      message: "Categories retrieved successfully",
    };
  }
}

export const projectsApi = new ProjectsApi();