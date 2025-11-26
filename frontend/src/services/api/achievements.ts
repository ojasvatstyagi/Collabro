import { BaseApi, ApiResponse } from './base';

// Achievement-related interfaces
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'projects' | 'badges' | 'collaborations' | 'time' | 'skills' | 'leadership';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  dateEarned?: string;
  progress?: {
    current: number;
    required: number;
  };
  isUnlocked: boolean;
  requirements: string[];
}

export interface UserStats {
  projectsCompleted: number;
  badgesEarned: number;
  collaborationsAchieved: number;
  timeContributed: string; // e.g., "120h"
  totalPoints: number;
  rank: string;
  level: number;
  experiencePoints: {
    current: number;
    required: number;
  };
}

export interface Leaderboard {
  rank: number;
  user: {
    id: string;
    username: string;
    profilePictureUrl: string;
  };
  points: number;
  level: number;
  badgesCount: number;
}

// Mock data for development
const mockAchievements: Achievement[] = [
  {
    id: "1",
    name: "First Project",
    description: "Successfully completed your first project",
    category: "projects",
    icon: "🚀",
    rarity: "common",
    points: 100,
    dateEarned: "2024-03-15T00:00:00Z",
    isUnlocked: true,
    requirements: ["Complete 1 project"],
  },
  {
    id: "2",
    name: "Team Player",
    description: "Collaborated with 5 different teams",
    category: "collaborations",
    icon: "🤝",
    rarity: "rare",
    points: 250,
    dateEarned: "2024-03-10T00:00:00Z",
    isUnlocked: true,
    requirements: ["Collaborate with 5 different teams"],
  },
  {
    id: "3",
    name: "Early Adopter",
    description: "Joined during the platform's first month",
    category: "badges",
    icon: "⭐",
    rarity: "epic",
    points: 500,
    dateEarned: "2024-02-01T00:00:00Z",
    isUnlocked: true,
    requirements: ["Join platform in first month"],
  },
  {
    id: "4",
    name: "Code Master",
    description: "Master 10 different programming languages",
    category: "skills",
    icon: "💻",
    rarity: "legendary",
    points: 1000,
    progress: {
      current: 7,
      required: 10,
    },
    isUnlocked: false,
    requirements: ["Add 10 different programming languages to skills"],
  },
  {
    id: "5",
    name: "Project Leader",
    description: "Successfully lead 3 projects to completion",
    category: "leadership",
    icon: "👑",
    rarity: "epic",
    points: 750,
    progress: {
      current: 1,
      required: 3,
    },
    isUnlocked: false,
    requirements: ["Lead 3 projects to completion"],
  },
  {
    id: "6",
    name: "Time Warrior",
    description: "Contribute 100+ hours to projects",
    category: "time",
    icon: "⏰",
    rarity: "rare",
    points: 300,
    progress: {
      current: 85,
      required: 100,
    },
    isUnlocked: false,
    requirements: ["Contribute 100+ hours to projects"],
  },
];

const mockUserStats: UserStats = {
  projectsCompleted: 5,
  badgesEarned: 12,
  collaborationsAchieved: 8,
  timeContributed: "120h",
  totalPoints: 2850,
  rank: "Gold",
  level: 15,
  experiencePoints: {
    current: 2850,
    required: 3000,
  },
};

const mockLeaderboard: Leaderboard[] = [
  {
    rank: 1,
    user: {
      id: "1",
      username: "codemaster_alex",
      profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    points: 5420,
    level: 28,
    badgesCount: 25,
  },
  {
    rank: 2,
    user: {
      id: "2",
      username: "sarah_dev_pro",
      profilePictureUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    points: 4890,
    level: 24,
    badgesCount: 22,
  },
  {
    rank: 3,
    user: {
      id: "3",
      username: "mike_fullstack",
      profilePictureUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    points: 4320,
    level: 21,
    badgesCount: 19,
  },
  {
    rank: 4,
    user: {
      id: "4",
      username: "johndoe",
      profilePictureUrl: "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    points: 2850,
    level: 15,
    badgesCount: 12,
  },
];

class AchievementsApi extends BaseApi {
  // Get user achievements
  async getUserAchievements(category?: Achievement['category']): Promise<ApiResponse<Achievement[]>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const params = category ? `?category=${category}` : '';
      return this.get<Achievement[]>(`/achievements/me${params}`);
    }

    let filteredAchievements = [...mockAchievements];

    if (category) {
      filteredAchievements = filteredAchievements.filter(achievement => achievement.category === category);
    }

    return {
      success: true,
      data: filteredAchievements,
      message: "User achievements retrieved successfully",
    };
  }

  // Get all available achievements
  async getAllAchievements(category?: Achievement['category']): Promise<ApiResponse<Achievement[]>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const params = category ? `?category=${category}` : '';
      return this.get<Achievement[]>(`/achievements/all${params}`);
    }

    let allAchievements = [...mockAchievements];

    // Add some locked achievements for demo
    const lockedAchievements: Achievement[] = [
      {
        id: "7",
        name: "Mentor",
        description: "Help 10 new users complete their first project",
        category: "leadership",
        icon: "🎓",
        rarity: "epic",
        points: 800,
        isUnlocked: false,
        requirements: ["Help 10 new users complete their first project"],
        progress: {
          current: 0,
          required: 10,
        },
      },
      {
        id: "8",
        name: "Innovation Award",
        description: "Create a project that gets featured",
        category: "badges",
        icon: "🏆",
        rarity: "legendary",
        points: 1500,
        isUnlocked: false,
        requirements: ["Create a featured project"],
      },
    ];

    allAchievements = [...allAchievements, ...lockedAchievements];

    if (category) {
      allAchievements = allAchievements.filter(achievement => achievement.category === category);
    }

    return {
      success: true,
      data: allAchievements,
      message: "All achievements retrieved successfully",
    };
  }

  // Get user statistics
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<UserStats>('/achievements/stats');
    }

    return {
      success: true,
      data: mockUserStats,
      message: "User statistics retrieved successfully",
    };
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 10, timeframe: 'all' | 'month' | 'week' = 'all'): Promise<ApiResponse<Leaderboard[]>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<Leaderboard[]>(`/achievements/leaderboard?limit=${limit}&timeframe=${timeframe}`);
    }

    const leaderboard = mockLeaderboard.slice(0, limit);

    return {
      success: true,
      data: leaderboard,
      message: "Leaderboard retrieved successfully",
    };
  }

  // Get achievement by ID
  async getAchievementById(achievementId: string): Promise<ApiResponse<Achievement>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<Achievement>(`/achievements/${achievementId}`);
    }

    const achievement = mockAchievements.find(a => a.id === achievementId);
    if (!achievement) {
      throw {
        message: "Achievement not found",
        status: 404,
      };
    }

    return {
      success: true,
      data: achievement,
      message: "Achievement retrieved successfully",
    };
  }

  // Claim achievement (if requirements are met)
  async claimAchievement(achievementId: string): Promise<ApiResponse<Achievement>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<Achievement>(`/achievements/${achievementId}/claim`);
    }

    const achievement = mockAchievements.find(a => a.id === achievementId);
    if (!achievement) {
      throw {
        message: "Achievement not found",
        status: 404,
      };
    }

    if (achievement.isUnlocked) {
      throw {
        message: "Achievement already unlocked",
        status: 409,
      };
    }

    // Mock requirements check
    if (achievement.progress && achievement.progress.current < achievement.progress.required) {
      throw {
        message: "Requirements not met",
        status: 400,
        errors: { requirements: "You haven't met the requirements for this achievement yet" },
      };
    }

    const unlockedAchievement: Achievement = {
      ...achievement,
      isUnlocked: true,
      dateEarned: new Date().toISOString(),
      progress: undefined,
    };

    return {
      success: true,
      data: unlockedAchievement,
      message: "Achievement unlocked successfully!",
    };
  }

  // Get achievement categories
  async getAchievementCategories(): Promise<ApiResponse<Array<{ category: Achievement['category']; count: number }>>> {
    await this.simulateDelay(200);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<Array<{ category: Achievement['category']; count: number }>>('/achievements/categories');
    }

    const categories = [
      { category: 'projects' as const, count: 8 },
      { category: 'badges' as const, count: 12 },
      { category: 'collaborations' as const, count: 6 },
      { category: 'time' as const, count: 4 },
      { category: 'skills' as const, count: 10 },
      { category: 'leadership' as const, count: 5 },
    ];

    return {
      success: true,
      data: categories,
      message: "Achievement categories retrieved successfully",
    };
  }

  // Download achievement badge
  async downloadAchievementBadge(achievementId: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    await this.simulateDelay(800);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<{ downloadUrl: string }>(`/achievements/${achievementId}/download`);
    }

    const achievement = mockAchievements.find(a => a.id === achievementId);
    if (!achievement || !achievement.isUnlocked) {
      throw {
        message: "Achievement not found or not unlocked",
        status: 404,
      };
    }

    // Mock download URL
    const downloadUrl = `https://api.example.com/achievements/${achievementId}/badge.png`;

    return {
      success: true,
      data: { downloadUrl },
      message: "Badge download link generated successfully",
    };
  }
}

export const achievementsApi = new AchievementsApi();