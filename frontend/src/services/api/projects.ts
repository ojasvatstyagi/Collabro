import { BaseApi, ApiResponse } from './base';

// Project-related interfaces
export interface Project {
  id: string; // UUID
  title: string;
  description: string;
  technologies: string[];
  level: 'BRAND_NEW' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  teamSize: number;
  category: string;
  budget: string;
  isRemote: boolean;
  isOpenSource: boolean;
  contactMethod: string;
  additionalInfo: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
    email: string;
    profilePictureUrl: string;
  };
  // Relations that might be populated
  post?: any;
  team?: any;
}

export interface ProjectFilters {
  level?: string;
  status?: string;
  technology?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  technologies: string[];
  level: 'BRAND_NEW' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: string;
  teamSize: number;
  category: string;
  budget: string;
  isRemote: boolean;
  isOpenSource: boolean;
  contactMethod: string;
  additionalInfo: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}

export interface JoinProjectRequest {
  message?: string;
}

class ProjectsApi extends BaseApi {
  // Get all projects with filters
  async getProjects(
    filters?: ProjectFilters
  ): Promise<ApiResponse<PageResponse<Project>>> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.level) params.append('level', filters.level);
      if (filters.technology) params.append('technology', filters.technology);
      if (filters.category) params.append('category', filters.category);
      if (filters.page !== undefined)
        params.append('page', filters.page.toString());
      if (filters.limit !== undefined)
        params.append('size', filters.limit.toString());
      if (filters.sort) params.append('sort', filters.sort);
    }
    return this.get<PageResponse<Project>>(`/projects?${params.toString()}`);
  }

  // Get project by ID
  async getProjectById(projectId: string): Promise<ApiResponse<Project>> {
    return this.get<Project>(`/projects/${projectId}`);
  }

  // Get user's projects
  async getUserProjects(userId?: string): Promise<ApiResponse<Project[]>> {
    const endpoint = userId ? `/projects/user/${userId}` : '/projects/me';
    return this.get<Project[]>(endpoint);
  }

  // Create new project
  async createProject(
    data: CreateProjectRequest
  ): Promise<ApiResponse<Project>> {
    return this.post<Project>('/projects', data);
  }

  // Update project
  async updateProject(
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<ApiResponse<Project>> {
    return this.put<Project>(`/projects/${projectId}`, data);
  }

  // Delete project
  async deleteProject(
    projectId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.delete<{ message: string }>(`/projects/${projectId}`);
  }

  // Join project
  async joinProject(
    projectId: string,
    request?: JoinProjectRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>(
      `/projects/${projectId}/join`,
      request
    );
  }

  // Leave project
  async leaveProject(
    projectId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>(`/projects/${projectId}/leave`);
  }

  // Get project categories
  async getCategories(): Promise<ApiResponse<string[]>> {
    return {
      success: true,

      data: [
        'Technology',
        'Design',
        'Marketing',
        'Business',
        'Finance',
        'Education',
        'Health',
        'Other',
      ],
    };
  }
}

export const projectsApi = new ProjectsApi();
