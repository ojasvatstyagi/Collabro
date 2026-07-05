import { BaseApi, ApiResponse } from './base';

export type AchievementCategory =
  | 'projects'
  | 'collaborations'
  | 'leadership'
  | 'skills'
  | 'badges';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementProgress {
  current: number;
  required: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  /** A lucide-react icon name, e.g. "Rocket" */
  icon: string;
  rarity: AchievementRarity;
  points: number;
  isUnlocked: boolean;
  progress: AchievementProgress;
  requirements: string[];
}

export interface AchievementStats {
  projectsCompleted: number;
  projectsCreated: number;
  collaborations: number;
  tasksCompleted: number;
  badgesEarned: number;
  totalBadges: number;
  totalPoints: number;
  level: number;
  rank: string;
  experience: {
    current: number;
    required: number;
  };
}

export interface AchievementOverview {
  stats: AchievementStats;
  achievements: Achievement[];
}

class AchievementsApi extends BaseApi {
  async getMyAchievements(): Promise<ApiResponse<AchievementOverview>> {
    return this.get<AchievementOverview>('/achievements/me');
  }
}

export const achievementsApi = new AchievementsApi();
