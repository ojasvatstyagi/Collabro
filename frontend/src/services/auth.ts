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

// Simulated API call for login
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // This would be an actual API call in a real application
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    // Simulate API response for demo purposes
    if (!response.ok) {
      return {
        success: false,
        message: 'Invalid username or password',
      };
    }
    
    return {
      success: true,
      user: {
        id: '1',
        username: credentials.username,
      },
      token: 'mock-jwt-token',
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An error occurred during login. Please try again.',
    };
  }
};

// Simulated API call for registration
export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    // This would be an actual API call in a real application
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    // Simulate API response for demo purposes
    if (!response.ok) {
      if (credentials.username === 'admin') {
        return {
          success: false,
          message: 'Username already taken',
        };
      }
      
      if (credentials.email === 'admin@example.com') {
        return {
          success: false,
          message: 'Email already registered',
        };
      }
      
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
    
    return {
      success: true,
      user: {
        id: '1',
        username: credentials.username,
        email: credentials.email,
      },
      token: 'mock-jwt-token',
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'An error occurred during registration. Please try again.',
    };
  }
};

// Simulated API call for forgot password
export const forgotPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Simulate API response
    if (!response.ok) {
      return {
        success: false,
        message: 'Email not found in our records.',
      };
    }

    return {
      success: true,
      message: 'Recovery instructions sent successfully.',
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    };
  }
};

// Simulated API call for OTP verification
export const verifyOtp = async (email: string, otp: string): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    // Simulate API response
    if (!response.ok) {
      return {
        success: false,
        message: 'Invalid or expired verification code.',
      };
    }

    return {
      success: true,
      message: 'OTP verified successfully.',
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    };
  }
};

// Simulated API call for password reset
export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, newPassword }),
    });

    // Simulate API response
    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to reset password. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Password reset successful.',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: 'An error occurred. Please try again.',
    };
  }
};