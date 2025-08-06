import { BaseApi, ApiResponse } from './base';

// Profile-related interfaces
export interface ProfileData {
  id: string;
  firstname: string;
  lastname: string;
  bio: string;
  education: string;
  profilePictureUrl: string;
  isProfileComplete: boolean;
  completionPercentage: number;
  skills: Skill[];
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  skillName: string;
  createdAt: string;
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
}

export interface AddSkillRequest {
  skillName: string;
}

export interface UploadProfilePictureResponse {
  profilePictureUrl: string;
  message: string;
}

// Mock data for development
const mockSkills: Skill[] = [
  { id: "1", skillName: "React", createdAt: "2024-01-01T00:00:00Z" },
  { id: "2", skillName: "TypeScript", createdAt: "2024-01-02T00:00:00Z" },
  { id: "3", skillName: "Node.js", createdAt: "2024-01-03T00:00:00Z" },
  { id: "4", skillName: "Python", createdAt: "2024-01-04T00:00:00Z" },
  { id: "5", skillName: "UI/UX Design", createdAt: "2024-01-05T00:00:00Z" },
];

const mockProfile: ProfileData = {
  id: "1",
  firstname: "John",
  lastname: "Doe",
  bio: "Full-stack developer passionate about building great user experiences and solving complex problems.",
  education: "B.S. Computer Science, Stanford University",
  profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
  isProfileComplete: false,
  completionPercentage: 80,
  skills: mockSkills,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-20T00:00:00Z",
};

const mockProfileStatus: ProfileStatus = {
  isComplete: false,
  completionPercentage: 80,
  missingFields: ["education"],
};

class ProfileApi extends BaseApi {
  // Get current user's profile
  async getProfile(): Promise<ApiResponse<ProfileData>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<ProfileData>('/profile/me');
    }

    return {
      success: true,
      data: mockProfile,
      message: "Profile retrieved successfully",
    };
  }

  // Get profile completion status
  async getProfileStatus(): Promise<ApiResponse<ProfileStatus>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<ProfileStatus>('/profile/status');
    }

    return {
      success: true,
      data: mockProfileStatus,
      message: "Profile status retrieved successfully",
    };
  }

  // Update profile
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<ProfileData>> {
    await this.simulateDelay(800);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<ProfileData>('/profile/me', data);
    }

    // Mock updated profile
    const updatedProfile: ProfileData = {
      ...mockProfile,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedProfile,
      message: "Profile updated successfully",
    };
  }

  // Get user profile by ID
  async getProfileById(userId: string): Promise<ApiResponse<ProfileData>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<ProfileData>(`/profile/${userId}`);
    }

    return {
      success: true,
      data: { ...mockProfile, id: userId },
      message: "Profile retrieved successfully",
    };
  }

  // Add skill
  async addSkill(request: AddSkillRequest): Promise<ApiResponse<Skill>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<Skill>('/profile/skills', request);
    }

    // Mock validation
    if (mockSkills.some(skill => skill.skillName.toLowerCase() === request.skillName.toLowerCase())) {
      throw {
        message: "Skill already exists",
        status: 409,
        errors: { skillName: "This skill is already in your profile" },
      };
    }

    const newSkill: Skill = {
      id: Date.now().toString(),
      skillName: request.skillName,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: newSkill,
      message: "Skill added successfully",
    };
  }

  // Remove skill
  async removeSkill(skillId: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>(`/profile/skills/${skillId}`);
    }

    return {
      success: true,
      data: { message: "Skill removed successfully" },
      message: "Skill removed from your profile",
    };
  }

  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<ApiResponse<UploadProfilePictureResponse>> {
    await this.simulateDelay(1000);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      const formData = new FormData();
      formData.append('file', file);
      return this.post<UploadProfilePictureResponse>('/profile/upload-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    // Mock validation
    if (!file.type.startsWith('image/')) {
      throw {
        message: "Invalid file type",
        status: 400,
        errors: { file: "Please upload a valid image file" },
      };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw {
        message: "File too large",
        status: 400,
        errors: { file: "File size must be less than 5MB" },
      };
    }

    // Create mock URL from file
    const mockUrl = URL.createObjectURL(file);

    return {
      success: true,
      data: {
        profilePictureUrl: mockUrl,
        message: "Profile picture uploaded successfully",
      },
      message: "Profile picture updated",
    };
  }

  // Get all skills (for autocomplete/suggestions)
  async getAllSkills(): Promise<ApiResponse<string[]>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<string[]>('/profile/skills/all');
    }

    const allSkills = [
      "React", "Vue.js", "Angular", "Node.js", "Python", "Java", "TypeScript",
      "JavaScript", "PHP", "Ruby", "Go", "Rust", "Swift", "Kotlin", "Flutter",
      "React Native", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker",
      "AWS", "Firebase", "GraphQL", "REST API", "UI/UX Design", "Figma",
      "Adobe XD", "Photoshop", "Illustrator", "Machine Learning", "Data Science",
      "DevOps", "Kubernetes", "Jenkins", "Git", "Linux", "Windows", "macOS"
    ];

    return {
      success: true,
      data: allSkills,
      message: "Skills retrieved successfully",
    };
  }
}

export const profileApi = new ProfileApi();