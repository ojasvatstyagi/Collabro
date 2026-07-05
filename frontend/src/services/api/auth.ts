import { BaseApi, ApiResponse } from './base';
import { tokenService } from '../tokenService';

// Auth-related interfaces (unchanged)
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
  role: string;
  firstname?: string;
  lastname?: string;
  profilePictureUrl?: string;
  isProfileComplete?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
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

class AuthApi extends BaseApi {
  // Login user -> POST /api/auth/login
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/login', credentials);

    // Store access token if present
    if (response.success && response.data?.accessToken) {
      tokenService.setAccessToken(response.data.accessToken);
    }

    return response;
  }

  // Register new user -> POST /api/auth/register
  async register(
    credentials: RegisterCredentials
  ): Promise<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/auth/register', credentials);
  }

  // Forgot password -> POST /api/auth/forgot-password
  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>('/auth/forgot-password', request);
  }

  // Verify OTP -> POST /api/auth/verify-otp  { email, otp }
  // Sent in the body, never the URL, so the code stays out of logs and browser history
  async verifyOtp(
    request: VerifyOtpRequest
  ): Promise<ApiResponse<{ verified: boolean }>> {
    return this.post<{ verified: boolean }>('/auth/verify-otp', request);
  }

  // Reset password -> POST /api/auth/reset-password  { email, otp, newPassword }
  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>('/auth/reset-password', request);
  }

  // Verify registration OTP -> POST /api/auth/verify-registration-otp  { email, otp }
  async verifyRegistrationOtp(
    request: VerifyOtpRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>(
      '/auth/verify-registration-otp',
      request
    );
  }

  // Change password -> PUT /api/auth/change-password
  async changePassword(
    request: ChangePasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return this.put<{ message: string }>('/auth/change-password', request);
  }

  // Logout user -> POST /api/auth/logout
  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.post<{ message: string }>('/auth/logout', {});
    } finally {
      // Forget the token even if the server call failed, or a reload would log the user back in
      tokenService.clearAccessToken();
    }
  }

  // Refresh token -> POST /api/auth/refresh (handled automatically by interceptor)
  async refreshToken(): Promise<
    ApiResponse<{ accessToken: string; tokenType: string; expiresIn: number }>
  > {
    return this.post<{
      accessToken: string;
      tokenType: string;
      expiresIn: number;
    }>('/auth/refresh', {});
  }

  // Get current user -> GET /api/auth/me
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.get<{ user: User }>('/auth/me');
  }
}

export const authApi = new AuthApi();
