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

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tags: string[];
  dueDate: string;
  createdAt: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  projectId: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: string;
  tags?: string[];
  dueDate?: string;
  assigneeId?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: string;
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

  // Get joined projects
  async getJoinedProjects(): Promise<ApiResponse<Project[]>> {
    return this.get<Project[]>('/projects/joined');
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

  // Get project tasks
  async getProjectTasks(projectId: string): Promise<ApiResponse<Task[]>> {
    return this.get<Task[]>(`/projects/${projectId}/tasks`);
  }

  // Create task
  async createTask(
    projectId: string,
    data: CreateTaskRequest
  ): Promise<ApiResponse<Task>> {
    return this.post<Task>(`/projects/${projectId}/tasks`, data);
  }

  // Update task
  async updateTask(
    taskId: string,
    data: UpdateTaskRequest
  ): Promise<ApiResponse<Task>> {
    return this.patch<Task>(`/tasks/${taskId}`, data);
  }

  // Delete task
  async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/tasks/${taskId}`);
  }

  // Get project team (placeholder for now)
  async getProjectTeam(projectId: string): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/projects/${projectId}/team`);
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

  // File Operations
  async uploadFile(
    projectId: string,
    file: File
  ): Promise<ApiResponse<ProjectFile>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post<ProjectFile>(`/projects/${projectId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getProjectFiles(
    projectId: string
  ): Promise<ApiResponse<ProjectFile[]>> {
    return this.get<ProjectFile[]>(`/projects/${projectId}/files`);
  }

  async deleteFile(fileId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/project-files/${fileId}`);
  }

  getDownloadUrl(fileId: string): string {
    return `${this.baseUrl}/project-files/${fileId}/download`;
  }

  // Chat Operations
  async getProjectMessages(
    projectId: string,
    page = 0,
    size = 20
  ): Promise<ApiResponse<PageResponse<ChatMessage>>> {
    return this.get<PageResponse<ChatMessage>>(
      `/projects/${projectId}/messages?page=${page}&size=${size}`
    );
  }

  async sendProjectMessage(
    projectId: string,
    content: string
  ): Promise<ApiResponse<ChatMessage>> {
    return this.post<ChatMessage>(`/projects/${projectId}/messages`, {
      content,
    });
  }
}

export interface ProjectFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  size: number;
  createdAt: string;
  uploadedById: string;
  uploadedByName: string;
  uploadedByAvatar?: string;
  projectId: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  projectId: string;
}

export const projectsApi = new ProjectsApi();
