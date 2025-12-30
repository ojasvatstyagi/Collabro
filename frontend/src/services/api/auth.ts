import { BaseApi, ApiResponse } from "./base";

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
  token?: string;
  refreshToken?: string;
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
    // Directly call backend
    return this.post<AuthResponse>("/auth/login", credentials);
  }

  // Register new user -> POST /api/auth/register
  async register(
    credentials: RegisterCredentials
  ): Promise<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>("/auth/register", credentials);
  }

  // Forgot password -> POST /api/auth/forgot-password
  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>("/auth/forgot-password", request);
  }

  // Verify OTP -> POST /api/auth/verify-otp?email=...&otp=...
  // (Your backend expects RequestParam, so we send params in the URL)
  async verifyOtp(
    request: VerifyOtpRequest
  ): Promise<ApiResponse<{ verified: boolean }>> {
    const url = `/auth/verify-otp?email=${encodeURIComponent(
      request.email
    )}&otp=${encodeURIComponent(request.otp)}`;
    return this.post<{ verified: boolean }>(url, {}); // empty body
  }

  // Reset password -> POST /api/auth/reset-password?email=...&otp=...&newPassword=...
  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    const url = `/auth/reset-password?email=${encodeURIComponent(
      request.email
    )}&otp=${encodeURIComponent(request.otp)}&newPassword=${encodeURIComponent(
      request.newPassword
    )}`;
    return this.post<{ message: string }>(url, {}); // empty body
  }

  // Verify registration OTP -> POST /api/auth/verify-registration-otp?email=...&otp=...
  async verifyRegistrationOtp(
    request: VerifyOtpRequest
  ): Promise<ApiResponse<{ message: string }>> {
    const url = `/auth/verify-registration-otp?email=${encodeURIComponent(
      request.email
    )}&otp=${encodeURIComponent(request.otp)}`;
    return this.post<{ message: string }>(url, {});
  }

  // Change password -> PUT /api/auth/change-password
  async changePassword(
    request: ChangePasswordRequest
  ): Promise<ApiResponse<{ message: string }>> {
    return this.put<{ message: string }>("/auth/change-password", request);
  }

  // Logout user -> POST /api/auth/logout
  async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.post<{ message: string }>("/auth/logout", {});
  }

  // Refresh token -> POST /api/auth/refresh (if implemented server-side)
  async refreshToken(): Promise<
    ApiResponse<{ token: string; expiresIn: number }>
  > {
    return this.post<{ token: string; expiresIn: number }>("/auth/refresh", {});
  }

  // Get current user -> GET /api/auth/me
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.get<{ user: User }>("/auth/me");
  }
}

export const authApi = new AuthApi();
