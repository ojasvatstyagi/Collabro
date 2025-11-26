import { BaseApi, ApiResponse } from './base';

// Settings-related interfaces
export interface UserSettings {
  id: string;
  userId: string;
  notifications: {
    email: boolean;
    push: boolean;
    projectInvitations: boolean;
    teamUpdates: boolean;
    achievements: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'team-only';
    showEmail: boolean;
    showProjects: boolean;
    showSkills: boolean;
    allowTeamInvites: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    themeColor: 'orange' | 'blue' | 'purple' | 'green';
    language: string;
    timezone: string;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
  };
  teamPreferences: {
    openForInvites: boolean;
    preferredTeamSize: 'small' | 'medium' | 'large' | 'any';
    workStyle: 'remote' | 'in-person' | 'hybrid' | 'any';
    interests: string[];
    availability: {
      hoursPerWeek: number;
      timezone: string;
      flexibleSchedule: boolean;
    };
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number; // in minutes
    loginNotifications: boolean;
    deviceTrust: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
  preferences?: Partial<UserSettings['preferences']>;
  teamPreferences?: Partial<UserSettings['teamPreferences']>;
  security?: Partial<UserSettings['security']>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

export interface VerifyTwoFactorRequest {
  code: string;
  secret: string;
}

export interface ExportDataRequest {
  format: 'json' | 'csv';
  includeProjects: boolean;
  includeMessages: boolean;
  includeHistory: boolean;
}

// Mock data for development
const mockUserSettings: UserSettings = {
  id: "1",
  userId: "1",
  notifications: {
    email: true,
    push: true,
    projectInvitations: true,
    teamUpdates: true,
    achievements: true,
    weeklyDigest: false,
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showProjects: true,
    showSkills: true,
    allowTeamInvites: true,
  },
  preferences: {
    theme: 'light',
    themeColor: 'orange',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  },
  teamPreferences: {
    openForInvites: true,
    preferredTeamSize: 'medium',
    workStyle: 'remote',
    interests: ['Web Development', 'Mobile Apps', 'AI/ML'],
    availability: {
      hoursPerWeek: 20,
      timezone: 'America/New_York',
      flexibleSchedule: true,
    },
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 60,
    loginNotifications: true,
    deviceTrust: false,
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-20T00:00:00Z",
};

class SettingsApi extends BaseApi {
  // Get user settings
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<UserSettings>('/settings/me');
    }

    return {
      success: true,
      data: mockUserSettings,
      message: "Settings retrieved successfully",
    };
  }

  // Update user settings
  async updateSettings(data: UpdateSettingsRequest): Promise<ApiResponse<UserSettings>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<UserSettings>('/settings/me', data);
    }

    // Mock updated settings
    const updatedSettings: UserSettings = {
      ...mockUserSettings,
      notifications: { ...mockUserSettings.notifications, ...data.notifications },
      privacy: { ...mockUserSettings.privacy, ...data.privacy },
      preferences: { ...mockUserSettings.preferences, ...data.preferences },
      teamPreferences: { ...mockUserSettings.teamPreferences, ...data.teamPreferences },
      security: { ...mockUserSettings.security, ...data.security },
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: updatedSettings,
      message: "Settings updated successfully",
    };
  }

  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(800);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<{ message: string }>('/settings/change-password', data);
    }

    // Mock validation
    if (data.currentPassword !== "password") {
      throw {
        message: "Current password is incorrect",
        status: 400,
        errors: { currentPassword: "Current password is incorrect" },
      };
    }

    if (data.newPassword !== data.confirmPassword) {
      throw {
        message: "Passwords do not match",
        status: 400,
        errors: { confirmPassword: "Passwords do not match" },
      };
    }

    if (data.newPassword.length < 8) {
      throw {
        message: "Password must be at least 8 characters long",
        status: 400,
        errors: { newPassword: "Password must be at least 8 characters long" },
      };
    }

    return {
      success: true,
      data: { message: "Password changed successfully" },
      message: "Your password has been updated",
    };
  }

  // Setup two-factor authentication
  async setupTwoFactor(): Promise<ApiResponse<TwoFactorSetupResponse>> {
    await this.simulateDelay(1000);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<TwoFactorSetupResponse>('/settings/2fa/setup');
    }

    const setupData: TwoFactorSetupResponse = {
      qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      secret: "JBSWY3DPEHPK3PXP",
      backupCodes: [
        "12345678",
        "87654321",
        "11223344",
        "44332211",
        "55667788",
        "88776655",
        "99001122",
        "22110099",
      ],
    };

    return {
      success: true,
      data: setupData,
      message: "Two-factor authentication setup initiated",
    };
  }

  // Verify and enable two-factor authentication
  async verifyTwoFactor(data: VerifyTwoFactorRequest): Promise<ApiResponse<{ message: string; backupCodes: string[] }>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string; backupCodes: string[] }>('/settings/2fa/verify', data);
    }

    // Mock validation
    if (data.code !== "123456") {
      throw {
        message: "Invalid verification code",
        status: 400,
        errors: { code: "Invalid verification code" },
      };
    }

    const backupCodes = [
      "12345678",
      "87654321",
      "11223344",
      "44332211",
      "55667788",
      "88776655",
      "99001122",
      "22110099",
    ];

    return {
      success: true,
      data: {
        message: "Two-factor authentication enabled successfully",
        backupCodes,
      },
      message: "Two-factor authentication is now enabled",
    };
  }

  // Disable two-factor authentication
  async disableTwoFactor(password: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string }>('/settings/2fa/disable', { password });
    }

    // Mock validation
    if (password !== "password") {
      throw {
        message: "Incorrect password",
        status: 400,
        errors: { password: "Incorrect password" },
      };
    }

    return {
      success: true,
      data: { message: "Two-factor authentication disabled successfully" },
      message: "Two-factor authentication has been disabled",
    };
  }

  // Get available timezones
  async getTimezones(): Promise<ApiResponse<Array<{ value: string; label: string; offset: string }>>> {
    await this.simulateDelay(200);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<Array<{ value: string; label: string; offset: string }>>('/settings/timezones');
    }

    const timezones = [
      { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
      { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
      { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
      { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 'UTC+0' },
      { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: 'UTC+1' },
      { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 'UTC+9' },
      { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 'UTC+8' },
      { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: 'UTC+10' },
    ];

    return {
      success: true,
      data: timezones,
      message: "Timezones retrieved successfully",
    };
  }

  // Export user data
  async exportData(request: ExportDataRequest): Promise<ApiResponse<{ downloadUrl: string; expiresAt: string }>> {
    await this.simulateDelay(2000);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ downloadUrl: string; expiresAt: string }>('/settings/export-data', request);
    }

    const downloadUrl = `https://api.example.com/exports/user-data-${Date.now()}.${request.format}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

    return {
      success: true,
      data: {
        downloadUrl,
        expiresAt,
      },
      message: "Data export generated successfully",
    };
  }

  // Delete account
  async deleteAccount(password: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(1000);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.delete<{ message: string }>('/settings/delete-account', {
        data: { password, reason },
      });
    }

    // Mock validation
    if (password !== "password") {
      throw {
        message: "Incorrect password",
        status: 400,
        errors: { password: "Incorrect password" },
      };
    }

    return {
      success: true,
      data: { message: "Account deletion initiated" },
      message: "Your account will be deleted within 24 hours",
    };
  }

  // Get account deletion status
  async getAccountDeletionStatus(): Promise<ApiResponse<{ 
    isPending: boolean; 
    scheduledAt?: string; 
    canCancel: boolean; 
  }>> {
    await this.simulateDelay(300);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<{ 
        isPending: boolean; 
        scheduledAt?: string; 
        canCancel: boolean; 
      }>('/settings/delete-account/status');
    }

    return {
      success: true,
      data: {
        isPending: false,
        canCancel: false,
      },
      message: "Account deletion status retrieved",
    };
  }

  // Cancel account deletion
  async cancelAccountDeletion(): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string }>('/settings/delete-account/cancel');
    }

    return {
      success: true,
      data: { message: "Account deletion cancelled successfully" },
      message: "Your account deletion has been cancelled",
    };
  }
}

export const settingsApi = new SettingsApi();