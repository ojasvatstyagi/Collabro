import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    email?: string;
  };
  token?: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', credentials);
    return {
      success: true,
      message: 'Login successful',
    };
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login failed';
    return {
      success: false,
      message,
    };
  }
};

export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/register', credentials);
    return {
      success: true,
      message: 'Registration successful. Please verify your email.',
    };
  } catch (error: any) {
    const message = error.response?.data?.message || 'Registration failed';
    return { success: false, message };
  }
};

export const forgotPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return {
      success: true,
      message: 'OTP sent to your email',
    };
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to send OTP';
    return { success: false, message };
  }
};

export const verifyOtp = async (email: string, otp: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/verify-otp', null, {
      params: { email, otp }, // @RequestParam
    });
    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error: any) {
    const message = error.response?.data?.message || 'Invalid or expired OTP';
    return { success: false, message };
  }
};

export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/reset-password', null, {
      params: { email, otp, newPassword }, // @RequestParam
    });
    return {
      success: true,
      message: 'Password reset successful',
    };
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to reset password';
    return { success: false, message };
  }
};

export const verifyRegistrationOtp = async (email: string, otp: string): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/verify-registration-otp', null, {
      params: { email, otp }, // Spring's @RequestParam
    });
    return {
      success: true,
      message: 'Registration verified successfully. You can now log in.',
    };
  } catch (error: any) {
    const message = error.response?.data?.message || 'OTP verification failed';
    return { success: false, message };
  }
};

export const logout = async (): Promise<AuthResponse> => {
  try {
    await api.post('/auth/logout'); // Spring should clear the cookie
    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error: any) {
    const message = error.response?.data?.message || 'Logout failed';
    return { success: false, message };
  }
};