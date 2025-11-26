import { BaseApi, ApiResponse } from './base';

// Workspace-related interfaces
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee: {
    id: string;
    username: string;
    profilePictureUrl: string;
  };
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  comments: number;
  attachments: number;
  projectId: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
  isShared: boolean;
  uploadedBy: {
    id: string;
    username: string;
    profilePictureUrl: string;
  };
  uploadedAt: string;
  projectId: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  type: 'text' | 'file' | 'system';
  sender: {
    id: string;
    username: string;
    profilePictureUrl: string;
  };
  timestamp: string;
  projectId: string;
  reactions?: Array<{
    emoji: string;
    users: string[];
  }>;
  replyTo?: string;
  edited?: boolean;
  editedAt?: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assigneeId: string;
  dueDate: string;
  tags: string[];
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  status?: 'todo' | 'in-progress' | 'review' | 'done';
}

export interface SendMessageRequest {
  content: string;
  type?: 'text' | 'file';
  replyTo?: string;
}

export interface UploadFileRequest {
  file: File;
  isShared?: boolean;
}

// Mock data for development
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Design user authentication flow",
    description: "Create wireframes and mockups for login, register, and password reset flows",
    status: "done",
    priority: "high",
    assignee: {
      id: "4",
      username: "emma_designer",
      profilePictureUrl: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    dueDate: "2024-01-20T00:00:00Z",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-19T00:00:00Z",
    tags: ["UI/UX", "Authentication"],
    comments: 5,
    attachments: 3,
    projectId: "1",
  },
  {
    id: "2",
    title: "Implement user authentication API",
    description: "Build JWT-based authentication system with refresh tokens",
    status: "in-progress",
    priority: "high",
    assignee: {
      id: "3",
      username: "alex_backend",
      profilePictureUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    dueDate: "2024-01-25T00:00:00Z",
    createdAt: "2024-01-16T00:00:00Z",
    updatedAt: "2024-01-22T00:00:00Z",
    tags: ["Backend", "API", "Security"],
    comments: 8,
    attachments: 1,
    projectId: "1",
  },
];

const mockFiles: ProjectFile[] = [
  {
    id: "1",
    name: "Project Requirements.pdf",
    type: "pdf",
    size: "2.4 MB",
    url: "#",
    isShared: true,
    uploadedBy: {
      id: "1",
      username: "sarah_dev",
      profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    uploadedAt: "2024-01-15T00:00:00Z",
    projectId: "1",
  },
  {
    id: "2",
    name: "UI Mockups.fig",
    type: "figma",
    size: "15.7 MB",
    url: "#",
    isShared: true,
    uploadedBy: {
      id: "4",
      username: "emma_designer",
      profilePictureUrl: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    uploadedAt: "2024-01-18T00:00:00Z",
    projectId: "1",
  },
];

const mockMessages: ChatMessage[] = [
  {
    id: "1",
    content: "Good morning team! Let's have a quick standup in 10 minutes.",
    type: "text",
    sender: {
      id: "1",
      username: "sarah_dev",
      profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    timestamp: "2024-01-22T09:00:00Z",
    projectId: "1",
  },
  {
    id: "2",
    content: "Sounds good! I've finished the product catalog component and it's ready for review.",
    type: "text",
    sender: {
      id: "2",
      username: "mike_frontend",
      profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    timestamp: "2024-01-22T09:02:00Z",
    projectId: "1",
    reactions: [{ emoji: "👍", users: ["1", "3"] }],
  },
];

class WorkspaceApi extends BaseApi {
  // Get project tasks
  async getTasks(projectId: string, filters?: { status?: string; assignee?: string }): Promise<ApiResponse<Task[]>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      return this.get<Task[]>(`/projects/${projectId}/tasks?${params.toString()}`);
    }

    let filteredTasks = mockTasks.filter(task => task.projectId === projectId);

    if (filters?.status && filters.status !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }

    if (filters?.assignee) {
      filteredTasks = filteredTasks.filter(task => task.assignee.id === filters.assignee);
    }

    return {
      success: true,
      data: filteredTasks,
      message: "Tasks retrieved successfully",
    };
  }

  // Create task
  async createTask(projectId: string, data: CreateTaskRequest): Promise<ApiResponse<Task>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<Task>(`/projects/${projectId}/tasks`, data);
    }

    const newTask: Task = {
      id: Date.now().toString(),
      ...data,
      status: 'todo',
      comments: 0,
      attachments: 0,
      projectId,
      assignee: {
        id: data.assigneeId,
        username: "user_" + data.assigneeId,
        profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: newTask,
      message: "Task created successfully",
    };
  }

  // Update task
  async updateTask(projectId: string, taskId: string, data: UpdateTaskRequest): Promise<ApiResponse<Task>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<Task>(`/projects/${projectId}/tasks/${taskId}`, data);
    }

    const task = mockTasks.find(t => t.id === taskId && t.projectId === projectId);
    if (!task) {
      throw {
        message: "Task not found",
        status: 404,
      };
    }

    const updatedTask: Task = {
      ...task,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedTask,
      message: "Task updated successfully",
    };
  }

  // Delete task
  async deleteTask(projectId: string, taskId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/projects/${projectId}/tasks/${taskId}`);
    }

    return {
      success: true,
      data: { message: "Task deleted successfully" },
      message: "Task has been deleted",
    };
  }

  // Get project files
  async getFiles(projectId: string): Promise<ApiResponse<ProjectFile[]>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<ProjectFile[]>(`/projects/${projectId}/files`);
    }

    const files = mockFiles.filter(file => file.projectId === projectId);

    return {
      success: true,
      data: files,
      message: "Files retrieved successfully",
    };
  }

  // Upload file
  async uploadFile(projectId: string, request: UploadFileRequest): Promise<ApiResponse<ProjectFile>> {
    await this.simulateDelay(1200);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('isShared', request.isShared?.toString() || 'false');
      return this.post<ProjectFile>(`/projects/${projectId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    // Mock validation
    if (request.file.size > 50 * 1024 * 1024) { // 50MB
      throw {
        message: "File too large",
        status: 400,
        errors: { file: "File size must be less than 50MB" },
      };
    }

    const newFile: ProjectFile = {
      id: Date.now().toString(),
      name: request.file.name,
      type: request.file.type.split('/')[1] || 'unknown',
      size: `${(request.file.size / 1024 / 1024).toFixed(1)} MB`,
      url: URL.createObjectURL(request.file),
      isShared: request.isShared || false,
      uploadedBy: {
        id: "1",
        username: "johndoe",
        profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
      },
      uploadedAt: new Date().toISOString(),
      projectId,
    };

    return {
      success: true,
      data: newFile,
      message: "File uploaded successfully",
    };
  }

  // Delete file
  async deleteFile(projectId: string, fileId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/projects/${projectId}/files/${fileId}`);
    }

    return {
      success: true,
      data: { message: "File deleted successfully" },
      message: "File has been deleted",
    };
  }

  // Get chat messages
  async getMessages(projectId: string, page: number = 1, limit: number = 50): Promise<ApiResponse<ChatMessage[]>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<ChatMessage[]>(`/projects/${projectId}/messages?page=${page}&limit=${limit}`);
    }

    const messages = mockMessages.filter(msg => msg.projectId === projectId);

    return {
      success: true,
      data: messages,
      message: "Messages retrieved successfully",
      meta: {
        page,
        limit,
        total: messages.length,
        totalPages: Math.ceil(messages.length / limit),
      },
    };
  }

  // Send message
  async sendMessage(projectId: string, data: SendMessageRequest): Promise<ApiResponse<ChatMessage>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<ChatMessage>(`/projects/${projectId}/messages`, data);
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: data.content,
      type: data.type || 'text',
      sender: {
        id: "1",
        username: "johndoe",
        profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
      },
      timestamp: new Date().toISOString(),
      projectId,
      replyTo: data.replyTo,
    };

    return {
      success: true,
      data: newMessage,
      message: "Message sent successfully",
    };
  }

  // Update message
  async updateMessage(projectId: string, messageId: string, content: string): Promise<ApiResponse<ChatMessage>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<ChatMessage>(`/projects/${projectId}/messages/${messageId}`, { content });
    }

    const message = mockMessages.find(m => m.id === messageId && m.projectId === projectId);
    if (!message) {
      throw {
        message: "Message not found",
        status: 404,
      };
    }

    const updatedMessage: ChatMessage = {
      ...message,
      content,
      edited: true,
      editedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedMessage,
      message: "Message updated successfully",
    };
  }

  // Delete message
  async deleteMessage(projectId: string, messageId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/projects/${projectId}/messages/${messageId}`);
    }

    return {
      success: true,
      data: { message: "Message deleted successfully" },
      message: "Message has been deleted",
    };
  }

  // Add reaction to message
  async addReaction(projectId: string, messageId: string, emoji: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(200);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string }>(`/projects/${projectId}/messages/${messageId}/reactions`, { emoji });
    }

    return {
      success: true,
      data: { message: "Reaction added successfully" },
      message: "Reaction added to message",
    };
  }

  // Remove reaction from message
  async removeReaction(projectId: string, messageId: string, emoji: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(200);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/projects/${projectId}/messages/${messageId}/reactions/${emoji}`);
    }

    return {
      success: true,
      data: { message: "Reaction removed successfully" },
      message: "Reaction removed from message",
    };
  }
}

export const workspaceApi = new WorkspaceApi();