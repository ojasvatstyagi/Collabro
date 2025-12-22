import { BaseApi, ApiResponse } from './base';

// Project-related interfaces
export interface Project {
  id: string; // UUID
  title: string;
  description: string;
  technologies: string[];
  level: 'BRAND_NEW' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  expectedTimePeriod: number; // In days or weeks? Assuming days based on int, or maybe undefined unit. Let's assume days for now.
  teamSize: number; // Target size or current size? Backend just says "teamSize".
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
    profilePictureUrl: string;
  };
  // Relations that might be populated
  post?: any; // Define properly if needed
  team?: any; // Define properly if needed

  // Fields NOT in backend but useful for UI (preserved if mapped, or removed if strictly following backend)
  // For now, I will keep 'applicants' as it might be a calculated field or coming from relations, 
  // but strictly speaking it's not on the main entity. I'll add optional fields for now to be safe.
  applicants?: number;
}

export interface ProjectFilters {
  level?: string;
  status?: string;
  technology?: string; // Singular 'technology' in backend column, 'technologies' in list
  search?: string; // Backend likely supports search
  page?: number;
  limit?: number;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  technologies: string[];
  level: 'BRAND_NEW' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  expectedTimePeriod: number;
  teamSize: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> { }

export interface JoinProjectRequest {
  message?: string;
}

// Mock data for development
const mockProjects: Project[] = [
  {
    id: "1",
    title: "Modern E-commerce Platform",
    description: "A full-stack e-commerce solution with real-time inventory management",
    technologies: ["React", "Node.js", "PostgreSQL", "Redis"],
    level: "INTERMEDIATE",
    expectedTimePeriod: 90,
    teamSize: 5,
    status: "ACTIVE",
    createdAt: "2024-01-15T00:00:00Z",
    createdBy: {
      id: "1",
      username: "sarah_dev",
      profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    applicants: 12
  },
  {
    id: "2",
    title: "AI-Powered Analytics Dashboard",
    description: "Data visualization platform with machine learning insights",
    technologies: ["Python", "React", "TensorFlow", "D3.js"],
    level: "ADVANCED",
    expectedTimePeriod: 120,
    teamSize: 6,
    status: "ACTIVE",
    createdAt: "2024-01-18T00:00:00Z",
    createdBy: {
      id: "2",
      username: "data_scientist_emma",
      profilePictureUrl: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    applicants: 8
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
            params.append(key, value.toString());
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
        project.technologies.some(tech => tech.toLowerCase().includes(search))
      );
    }

    if (filters?.level) {
      filteredProjects = filteredProjects.filter(project => project.level === filters.level);
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

    if (import.meta.env.PROD) {
      return this.post<Project>('/projects', data);
    }

    const newProject: Project = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      createdBy: {
        id: "1",
        username: "current_user",
        profilePictureUrl: "", // Mock
      }
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

    if (import.meta.env.PROD) {
      return this.post<{ message: string }>(`/projects/${projectId}/leave`);
    }

    return {
      success: true,
      data: { message: "Left project successfully" },
      message: "You have left the project",
    };
  }

  // Get project categories - BACKEND DOES NOT SUPPORT THIS YET (only PostType which is not exactly categories)
  async getCategories(): Promise<ApiResponse<string[]>> {
    await this.simulateDelay(200);

    // Removed specific categories as backend doesn't have them yet.
    // Could map PostType here if needed, but for now returning empty or generic.
    return {
      success: true,
      data: [],
      message: "Categories retrieved successfully",
    };
  }
}

export const projectsApi = new ProjectsApi();