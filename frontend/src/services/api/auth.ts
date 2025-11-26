import { BaseApi, ApiResponse } from './base';

// Auth-related interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstname?: string;
  lastname?: string;
  profilePictureUrl?: string;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Mock data for development
const mockUser: User = {
  id: "1",
  username: "johndoe",
  email: "john.doe@example.com",
  firstname: "John",
  lastname: "Doe",
  profilePictureUrl: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
  isProfileComplete: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-20T00:00:00Z",
};

class AuthApi extends BaseApi {
  // Login user
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    await this.simulateDelay(1000);

    // Mock validation
    if (credentials.username === "admin" && credentials.password === "password") {
      const authResponse: AuthResponse = {
        user: mockUser,
        token: "mock-jwt-token-" + Date.now(),
        refreshToken: "mock-refresh-token-" + Date.now(),
        expiresIn: 3600,
      };

      // Store token in localStorage for demo
      localStorage.setItem('authToken', authResponse.token);

      return {
        success: true,
        data: authResponse,
        message: "Login successful",
      };
    }

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<AuthResponse>('/auth/login', credentials);
    }

    // Mock error response
    throw {
      message: "Invalid username or password",
      status: 401,
    };
  }

  // Register new user
  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> {
    await this.simulateDelay(1200);

    // Mock validation
    if (credentials.username === "admin") {
      throw {
        message: "Username already taken",
        status: 409,
        errors: { username: "This username is already in use" },
      };
    }

    if (credentials.email === "admin@example.com") {
      throw {
        message: "Email already registered",
        status: 409,
        errors: { email: "This email is already registered" },
      };
    }

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<AuthResponse>('/auth/register', credentials);
    }

    // Mock success response
    const newUser: User = {
      ...mockUser,
      id: Date.now().toString(),
      username: credentials.username,
      email: credentials.email,
      firstname: undefined,
      lastname: undefined,
      isProfileComplete: false,
    };

    const authResponse: AuthResponse = {
      user: newUser,
      token: "mock-jwt-token-" + Date.now(),
      refreshToken: "mock-refresh-token-" + Date.now(),
      expiresIn: 3600,
    };

    return {
      success: true,
      data: authResponse,
      message: "Registration successful",
    };
  }

  // Forgot password
  async forgotPassword(request: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(800);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string }>('/auth/forgot-password', request);
    }

    // Mock validation
    const validEmails = ["test@example.com", "demo@example.com", "john.doe@example.com"];
    if (!validEmails.includes(request.email)) {
      throw {
        message: "Email not found in our records",
        status: 404,
      };
    }

    return {
      success: true,
      data: { message: "Password reset instructions sent to your email" },
      message: "Password reset email sent successfully",
    };
  }

  // Verify OTP
  async verifyOtp(request: VerifyOtpRequest): Promise<ApiResponse<{ verified: boolean }>> {
    await this.simulateDelay(600);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ verified: boolean }>('/auth/verify-otp', request);
    }

    // Mock validation
    if (request.otp !== "123456") {
      throw {
        message: "Invalid verification code",
        status: 400,
      };
    }

    return {
      success: true,
      data: { verified: true },
      message: "OTP verified successfully",
    };
  }

  // Reset password
  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(1000);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string }>('/auth/reset-password', request);
    }

    // Mock validation
    if (request.otp !== "123456") {
      throw {
        message: "Invalid verification code",
        status: 400,
      };
    }

    return {
      success: true,
      data: { message: "Password reset successfully" },
      message: "Your password has been reset successfully",
    };
  }

  // Change password
  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(800);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.put<{ message: string }>('/auth/change-password', request);
    }

    // Mock validation
    if (request.currentPassword !== "password") {
      throw {
        message: "Current password is incorrect",
        status: 400,
        errors: { currentPassword: "Current password is incorrect" },
      };
    }

    return {
      success: true,
      data: { message: "Password changed successfully" },
      message: "Your password has been updated",
    };
  }

  // Logout user
  async logout(): Promise<ApiResponse<{ message: string }>> {
    await this.simulateDelay(300);

    // Clear stored token
    localStorage.removeItem('authToken');

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ message: string }>('/auth/logout');
    }

    return {
      success: true,
      data: { message: "Logged out successfully" },
      message: "You have been logged out",
    };
  }

  // Refresh token
  async refreshToken(): Promise<ApiResponse<{ token: string; expiresIn: number }>> {
    await this.simulateDelay(400);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.post<{ token: string; expiresIn: number }>('/auth/refresh');
    }

    const newToken = "mock-jwt-token-" + Date.now();
    localStorage.setItem('authToken', newToken);

    return {
      success: true,
      data: {
        token: newToken,
        expiresIn: 3600,
      },
      message: "Token refreshed successfully",
    };
  }

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<User>> {
    await this.simulateDelay(500);

    // Simulate API call in production
    if (import.meta.env.PROD) {
      return this.get<User>('/auth/me');
    }

    return {
      success: true,
      data: mockUser,
      message: "User data retrieved successfully",
    };
  }
}

export const authApi = new AuthApi();