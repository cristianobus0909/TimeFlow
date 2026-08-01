import { authStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  public async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const { accessToken } = authStore.getState();
    const headers = new Headers(options.headers || {});

    // Set JSON headers by default if body is not FormData
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Attach Access Token if available
    if (accessToken && !options.skipAuth) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const url = `${API_URL}${path}`;
    let response = await fetch(url, config);

    // Auto-refresh token if 401 Unauthorized occurs
    if (response.status === 401 && accessToken && !options.skipAuth) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const newToken = await this.refreshToken();
          this.isRefreshing = false;
          this.onRefreshed(newToken);
          
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(url, { ...options, headers });
        } catch (refreshErr) {
          this.isRefreshing = false;

          // ACTIVE TIMER AUTH SHIELD:
          // Preserve session and active timer state when timer is running
          try {
            const { timerStore } = await import('@/store/timerStore');
            const isTimerRunning = timerStore.getState().isRunning;
            if (isTimerRunning) {
              console.warn('⚠ Refresh token delayed, preserving active session for running timer.');
              return {} as T;
            }
          } catch (e) {}

          authStore.getState().clearAuth();
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true';
          }
          return {} as T;
        }
      } else {
        // Wait for the token to be refreshed (for parallel requests)
        const retryPromise = new Promise<string>((resolve) => {
          this.subscribeTokenRefresh((token) => {
            resolve(token);
          });
        });

        const token = await retryPromise;
        headers.set('Authorization', `Bearer ${token}`);
        response = await fetch(url, { ...options, headers });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error en la petición: ${response.statusText}`);
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  private async refreshToken(): Promise<string> {
    const url = `${API_URL}/auth/refresh`;
    const storedRefreshToken = authStore.getState().refreshToken || localStorage.getItem('tf_refresh_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (storedRefreshToken) {
      headers['x-refresh-token'] = storedRefreshToken;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Refresh failed');
    }
    const data = await res.json();
    authStore.getState().setAuth(
      authStore.getState().user,
      data.accessToken,
      data.refreshToken || storedRefreshToken
    );
    return data.accessToken;
  }

  public get<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
