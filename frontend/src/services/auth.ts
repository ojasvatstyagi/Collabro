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
      // For demonstration, we'll simulate a failed login
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
      // For demonstration, we'll simulate some error cases
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