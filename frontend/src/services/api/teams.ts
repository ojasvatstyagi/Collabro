import { BaseApi, ApiResponse } from './base';

export type TeamRole = 'OWNER' | 'MEMBER';
export type TeamProjectStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SkillProficiency =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT';

export interface PublicSkill {
  id: string;
  name: string;
  proficiency: SkillProficiency;
}

export interface PublicProfile {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  bio: string | null;
  education: string | null;
  location: string | null;
  profilePictureUrl: string | null;
  skills: PublicSkill[];
}

export interface TeamSummary {
  id: number;
  name: string;
  projectId: string;
  projectTitle: string;
  projectStatus: TeamProjectStatus;
  /** The current user's role in this team */
  role: TeamRole;
  owner: PublicProfile;
  /** Members excluding the owner */
  members: PublicProfile[];
  /** Owner + members */
  memberCount: number;
  /** ISO local date-time without timezone */
  createdAt: string;
}

class TeamsApi extends BaseApi {
  /** Teams the current user owns or belongs to, newest first. */
  async getMyTeams(): Promise<ApiResponse<TeamSummary[]>> {
    return this.getAll<TeamSummary>('/teams/me');
  }
}

export const teamsApi = new TeamsApi();
