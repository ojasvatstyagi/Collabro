import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { tokenService } from '../tokenService';

// API Configuration
const API_BASE_URL = '/api'; // Use proxy
const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fired when the session can no longer be refreshed. AuthContext listens for it and
// drops its user, so ProtectedRoute redirects to /login without a full page reload.
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

// Auth endpoints that must never trigger a token refresh: they are how a session is
// obtained or ended, or they work without one. Every other call, including
// /auth/me, is an ordinary authenticated request and refreshes an expired token.
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/verify-otp',
  '/auth/reset-password',
  '/auth/verify-registration-otp',
];

const skipsRefresh = (url?: string): boolean =>
  !!url && NO_REFRESH_PATHS.some((path) => url.includes(path));

// The refresh in flight, shared by every request that hits a 401 meanwhile, so only one
// refresh happens at a time (the backend rotates the refresh token on each use).
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  const accessToken = response.data?.accessToken;
  if (!accessToken) {
    throw new Error('Refresh response did not contain an access token');
  }
  tokenService.setAccessToken(accessToken);
  return accessToken;
};

// Request interceptor to add access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling 401 and automatic token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      skipsRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    // Each request is retried at most once, so a persistent 401 cannot loop
    originalRequest._retry = true;

    let accessToken: string;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      accessToken = await refreshPromise;
    } catch (refreshError) {
      // The session is over: forget the token and let AuthContext route to /login
      tokenService.clearAccessToken();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      return Promise.reject(refreshError);
    }

    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return apiClient(originalRequest);
  }
);

// Generic API response interface
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Generic API error interface
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string>;
}

// Base API class with common methods
export class BaseApi {
  protected client: AxiosInstance;

  constructor() {
    this.client = apiClient;
  }

  public get baseUrl(): string {
    return API_BASE_URL;
  }

  // Generic GET request
  protected async get<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(endpoint, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Authenticated binary download (the token and refresh logic come from the shared client,
  // which a plain <a href> / window.open would bypass)
  protected async getBlob(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<Blob> {
    try {
      const response = await this.client.get<Blob>(endpoint, {
        ...config,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      // With responseType 'blob' even an error body arrives as a Blob; read the server's message out of it
      const body = (error as AxiosError).response?.data;
      if (body instanceof Blob) {
        const message = (await body.text()).trim();
        throw {
          message: message || 'An error occurred',
          status: (error as AxiosError).response?.status,
        } satisfies ApiError;
      }
      throw this.handleError(error);
    }
  }

  // Generic POST request
  protected async post<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(endpoint, data, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PUT request
  protected async put<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(endpoint, data, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic PATCH request
  protected async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch(endpoint, data, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Generic DELETE request
  protected async delete<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(endpoint, config);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle successful responses
  private handleResponse<T>(response: AxiosResponse): ApiResponse<T> {
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
      meta: response.data.meta,
    };
  }

  // Handle API errors
  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const data: unknown = error.response.data;
        const body =
          typeof data === 'object' && data !== null
            ? (data as { message?: string; errors?: Record<string, string> })
            : undefined;
        return {
          message:
            typeof data === 'string' ? data : body?.message || 'An error occurred',
          status: error.response.status,
          errors: body?.errors,
        };
      }
      if (error.request) {
        return { message: 'Network error. Please check your connection.' };
      }
    }
    return {
      message:
        error instanceof Error && error.message
          ? error.message
          : 'An unexpected error occurred',
    };
  }
}

export default apiClient;
