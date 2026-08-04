import { BaseApi, ApiResponse } from './base';
import { saveBlob } from '../../utils/download';
import type { PublicProfile } from './teams';

export interface Skill {
  id: string;
  name: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'; // Matches Backend Enum
  createdAt: string;
}

export interface SocialLink {
  id?: string;
  // Matches SocialPlatform.java exactly
  platform: 'LINKEDIN' | 'GITHUB' | 'TWITTER' | 'WEBSITE' | 'OTHER';
  url: string;
}

export interface ProfileData {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  bio: string;
  education: string;
  location: string;
  phone: string;
  profilePictureUrl: string;
  isProfileComplete: boolean;
  completionPercentage: number;
  skills: Skill[];
  socialLinks: SocialLink[];
  createdAt: string;
  updatedAt: string;

  // Settings
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  projectNotifications?: boolean;
  openForTeamInvites?: boolean;
  preferredTeamSize?: string;
  projectInterests?: string[];
}

export interface ProfileStatus {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
}

export interface UpdateProfileRequest {
  firstname: string;
  lastname: string;
  bio: string;
  education: string;
  location: string;
  phone: string;

  // Settings
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  projectNotifications?: boolean;
  openForTeamInvites?: boolean;
  preferredTeamSize?: string;
  projectInterests?: string[];
}

export interface AddSkillRequest {
  name: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
}

export interface AddSocialLinkRequest {
  platform: SocialLink['platform'];
  url: string;
}

class ProfileApi extends BaseApi {
  async getProfile(): Promise<ApiResponse<ProfileData>> {
    return this.get<ProfileData>('/profile/me');
  }

  // Another person's profile (no e-mail, phone or settings) -> GET /api/profile/users/{username}; 404 if unknown or deleted
  async getPublicProfile(username: string): Promise<ApiResponse<PublicProfile>> {
    return this.get<PublicProfile>(`/profile/users/${encodeURIComponent(username)}`);
  }

  async getProfileStatus(): Promise<ApiResponse<ProfileStatus>> {
    return this.get<ProfileStatus>('/profile/status');
  }

  async updateProfile(
    data: UpdateProfileRequest
  ): Promise<ApiResponse<ProfileData>> {
    return this.put<ProfileData>('/profile/me', data);
  }

  async addSkill(request: AddSkillRequest): Promise<ApiResponse<Skill>> {
    return this.post<Skill>('/profile/skills', request);
  }

  // New method for searching skills
  async searchSkills(query: string): Promise<ApiResponse<string[]>> {
    return this.get<string[]>('/profile/skills/search', { params: { query } });
  }

  async removeSkill(skillId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/profile/skills/${skillId}`);
  }

  async addSocialLink(
    request: AddSocialLinkRequest
  ): Promise<ApiResponse<SocialLink>> {
    return this.post<SocialLink>('/profile/social-links', request);
  }

  async removeSocialLink(socialLinkId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/profile/social-links/${socialLinkId}`);
  }

  async uploadProfilePicture(
    file: File
  ): Promise<ApiResponse<{ profilePictureUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post<{ profilePictureUrl: string }>(
      '/profile/picture',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  // Matches @DeleteMapping in ProfilePictureController
  async deleteProfilePicture(): Promise<ApiResponse<void>> {
    return this.delete<void>('/profile/picture');
  }

  // The password is re-checked by the backend before the account is deactivated
  async deleteAccount(password: string): Promise<ApiResponse<void>> {
    return this.delete<void>('/profile/me', { data: { password } });
  }

  // Matches @GetMapping("/export") in ProfileController. Throws on failure so the caller can tell the user.
  async exportProfilePdf(): Promise<void> {
    const blob = await this.getBlob('/profile/export');
    saveBlob(blob, 'profile_export.pdf');
  }
}

export const profileApi = new ProfileApi();
