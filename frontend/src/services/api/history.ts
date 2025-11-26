import { BaseApi, ApiResponse } from './base';

// History-related interfaces
export interface HistoryItem {
  id: string;
  type: 'project' | 'collaboration' | 'achievement' | 'request' | 'system' | 'skill' | 'profile';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'ongoing' | 'pending' | 'cancelled' | 'approved' | 'rejected';
  participants?: string[];
  projectName?: string;
  projectId?: string;
  metadata?: {
    duration?: string;
    teamSize?: number;
    technologies?: string[];
    rating?: number;
    points?: number;
    category?: string;
  };
  relatedUser?: {
    id: string;
    username: string;
    profilePictureUrl: string;
  };
}

export interface HistoryFilters {
  type?: HistoryItem['type'];
  status?: HistoryItem['status'];
  timeframe?: 'all' | 'week' | 'month' | 'quarter' | 'year';
  search?: string;
  page?: number;
  limit?: number;
}

export interface HistoryStats {
  totalActivities: number;
  projectsCompleted: number;
  collaborationsJoined: number;
  achievementsEarned: number;
  skillsAdded: number;
  thisWeek: number;
  thisMonth: number;
}

// Mock data for development
const mockHistoryItems: HistoryItem[] = [
  {
    id: "1",
    type: "project",
    title: "Completed E-commerce Platform",
    description: "Successfully delivered a full-stack e-commerce solution with real-time inventory management",
    timestamp: "2024-01-15T10:30:00Z",
    status: "completed",
    participants: ["sarah_dev", "mike_frontend", "alex_backend"],
    projectName: "Modern E-commerce Platform",
    projectId: "1",
    metadata: {
      duration: "3 months",
      teamSize: 4,
      technologies: ["React", "Node.js", "PostgreSQL"],
      rating: 4.8,
    },
  },
  {
    id: "2",
    type: "collaboration",
    title: "Joined AI Analytics Team",
    description: "Started collaboration on AI-powered analytics dashboard project",
    timestamp: "2024-01-10T14:20:00Z",
    status: "ongoing",
    participants: ["data_scientist_emma", "ml_engineer_raj"],
    projectName: "AI Analytics Dashboard",
    projectId: "2",
    metadata: {
      teamSize: 5,
      technologies: ["Python", "TensorFlow", "React"],
    },
  },
  {
    id: "3",
    type: "achievement",
    title: "Earned Team Player Badge",
    description: "Recognized for outstanding collaboration across multiple projects",
    timestamp: "2024-01-08T09:15:00Z",
    status: "completed",
    metadata: {
      points: 250,
      category: "collaborations",
    },
  },
  {
    id: "4",
    type: "request",
    title: "Project Request Approved",
    description: "Your request to join Mobile Fitness App project was approved",
    timestamp: "2024-01-05T16:45:00Z",
    status: "approved",
    participants: ["fitness_dev_lisa"],
    projectName: "Mobile Fitness App",
    projectId: "3",
    metadata: {
      teamSize: 3,
      technologies: ["React Native", "Firebase"],
    },
  },
  {
    id: "5",
    type: "project",
    title: "Started Project Management System",
    description: "Initiated development of collaborative project management platform",
    timestamp: "2024-01-03T11:00:00Z",
    status: "ongoing",
    participants: ["pm_david", "ux_designer_anna"],
    projectName: "Project Management System",
    projectId: "4",
    metadata: {
      teamSize: 6,
      technologies: ["Vue.js", "Express", "MongoDB"],
    },
  },
  {
    id: "6",
    type: "system",
    title: "Profile Updated",
    description: "Updated skills and education information",
    timestamp: "2024-01-01T08:30:00Z",
    status: "completed",
  },
  {
    id: "7",
    type: "collaboration",
    title: "Left Chat Application Team",
    description: "Completed contribution to real-time chat application project",
    timestamp: "2023-12-28T13:20:00Z",
    status: "completed",
    participants: ["chat_dev_tom", "ui_specialist_jane"],
    projectName: "Real-time Chat Application",
    projectId: "5",
    metadata: {
      duration: "2 months",
      teamSize: 3,
      technologies: ["React", "Socket.io", "WebRTC"],
      rating: 4.6,
    },
  },
  {
    id: "8",
    type: "request",
    title: "Request Declined",
    description: "Your request to join Blockchain Wallet project was declined",
    timestamp: "2023-12-25T10:15:00Z",
    status: "rejected",
    projectName: "Blockchain Wallet",
    projectId: "6",
  },
  {
    id: "9",
    type: "skill",
    title: "Added New Skill: TypeScript",
    description: "Added TypeScript to your skill set",
    timestamp: "2023-12-20T15:30:00Z",
    status: "completed",
  },
  {
    id: "10",
    type: "achievement",
    title: "Earned First Project Badge",
    description: "Completed your first project on the platform",
    timestamp: "2023-12-15T12:00:00Z",
    status: "completed",
    metadata: {
      points: 100,
      category: "projects",
    },
  },
];

const mockHistoryStats: HistoryStats = {
  totalActivities: 45,
  projectsCompleted: 8,
  collaborationsJoined: 12,
  achievementsEarned: 15,
  skillsAdded: 10,
  thisWeek: 3,
  thisMonth: 12,
};

class HistoryApi extends BaseApi {
  // Get user activity history
  async getHistory(filters?: HistoryFilters): Promise<ApiResponse<HistoryItem[]>> {
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
      return this.get<HistoryItem[]>(`/history?${params.toString()}`);
    }

    let filteredHistory = [...mockHistoryItems];

    // Apply filters
    if (filters?.type && filters.type !== 'all') {
      filteredHistory = filteredHistory.filter(item => item.type === filters.type);
    }

    if (filters?.status && filters.status !== 'all') {
      filteredHistory = filteredHistory.filter(item => item.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredHistory = filteredHistory.filter(item =>
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.projectName?.toLowerCase().includes(search)
      );
    }

    if (filters?.timeframe && filters.timeframe !== 'all') {
      const now = new Date();
      const timeframeDays = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365,
      };

      const cutoffDate = new Date(now.getTime() - timeframeDays[filters.timeframe] * 24 * 60 * 60 * 1000);
      filteredHistory = filteredHistory.filter(item => new Date(item.timestamp) >= cutoffDate);
    }

    // Sort by timestamp (newest first)
    filteredHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedHistory,
      message: "History retrieved successfully",
      meta: {
        page,
        limit,
        total: filteredHistory.length,
        totalPages: Math.ceil(filteredHistory.length / limit),
      },
    };
  }

  // Get history statistics
  async getHistoryStats(): Promise<ApiResponse<HistoryStats>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<HistoryStats>('/history/stats');
    }

    return {
      success: true,
      data: mockHistoryStats,
      message: "History statistics retrieved successfully",
    };
  }

  // Get history item by ID
  async getHistoryItemById(itemId: string): Promise<ApiResponse<HistoryItem>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<HistoryItem>(`/history/${itemId}`);
    }

    const item = mockHistoryItems.find(h => h.id === itemId);
    if (!item) {
      throw {
        message: "History item not found",
        status: 404,
      };
    }

    return {
      success: true,
      data: item,
      message: "History item retrieved successfully",
    };
  }

  // Delete history item
  async deleteHistoryItem(itemId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/history/${itemId}`);
    }

    return {
      success: true,
      data: { message: "History item deleted successfully" },
      message: "History item has been removed",
    };
  }

  // Clear history (with optional filters)
  async clearHistory(filters?: { type?: HistoryItem['type']; timeframe?: string }): Promise<ApiResponse<{ message: string; deletedCount: number }>> {
    await this.simulateDelay(800);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string; deletedCount: number }>('/history/clear', filters);
    }

    // Mock deletion count based on filters
    let deletedCount = mockHistoryItems.length;

    if (filters?.type) {
      deletedCount = mockHistoryItems.filter(item => item.type === filters.type).length;
    }

    return {
      success: true,
      data: {
        message: "History cleared successfully",
        deletedCount,
      },
      message: `${deletedCount} history items have been deleted`,
    };
  }

  // Export history data
  async exportHistory(format: 'json' | 'csv' = 'json', filters?: HistoryFilters): Promise<ApiResponse<{ downloadUrl: string }>> {
    await this.simulateDelay(1000);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      return this.get<{ downloadUrl: string }>(`/history/export?${params.toString()}`);
    }

    // Mock download URL
    const downloadUrl = `https://api.example.com/history/export/${Date.now()}.${format}`;

    return {
      success: true,
      data: { downloadUrl },
      message: "History export generated successfully",
    };
  }

  // Get activity timeline (grouped by date)
  async getActivityTimeline(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<ApiResponse<Array<{
    date: string;
    activities: HistoryItem[];
    count: number;
  }>>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<Array<{
        date: string;
        activities: HistoryItem[];
        count: number;
      }>>(`/history/timeline?timeframe=${timeframe}`);
    }

    // Group mock data by date
    const grouped = mockHistoryItems.reduce((acc, item) => {
      const date = new Date(item.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, HistoryItem[]>);

    const timeline = Object.entries(grouped)
      .map(([date, activities]) => ({
        date,
        activities,
        count: activities.length,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      success: true,
      data: timeline,
      message: "Activity timeline retrieved successfully",
    };
  }
}

export const historyApi = new HistoryApi();