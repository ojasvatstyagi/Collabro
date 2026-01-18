class TokenService {
  private accessToken: string | null = null;

  setAccessToken(token: string): void {
    this.accessToken = token;
    // Also store in localStorage as backup
    localStorage.setItem('accessToken', token);
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      // Try to retrieve from localStorage
      this.accessToken = localStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  clearAccessToken(): void {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

export const tokenService = new TokenService();
