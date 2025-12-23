import { BaseApi, ApiResponse } from './base';

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
}

export interface AddSkillRequest {
  name: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
}

export interface AddSocialLinkRequest {
  platform: 'LINKEDIN' | 'GITHUB' | 'TWITTER' | 'FACEBOOK' | 'INSTAGRAM';
  url: string;
}

class ProfileApi extends BaseApi {
  async getProfile(): Promise<ApiResponse<ProfileData>> {
    return this.get<ProfileData>('/profile/me');
  }

  async getProfileStatus(): Promise<ApiResponse<ProfileStatus>> {
    return this.get<ProfileStatus>('/profile/status');
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<ProfileData>> {
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

  async addSocialLink(request: AddSocialLinkRequest): Promise<ApiResponse<SocialLink>> {
    return this.post<SocialLink>('/profile/social-links', request);
  }

  async removeSocialLink(socialLinkId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/profile/social-links/${socialLinkId}`);
  }

  async uploadProfilePicture(file: File): Promise<ApiResponse<{ profilePictureUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.post<{ profilePictureUrl: string }>('/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  // Matches @DeleteMapping in ProfilePictureController
  async deleteProfilePicture(): Promise<ApiResponse<void>> {
    return this.delete<void>('/profile/picture');
  }

  // Matches @GetMapping("/export") in ProfileController
  async exportProfilePdf(): Promise<void> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'profile_export.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("PDF Export Error:", error);
    }
  }
}

export const profileApi = new ProfileApi();