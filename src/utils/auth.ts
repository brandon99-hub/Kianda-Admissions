/**
 * Central authentication utility for the Kianda Admissions Portal.
 * All API calls that require admin authorization MUST use these helpers.
 */

const TOKEN_KEY = 'kianda_admin_token';

// --- Token Management ---

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Returns true if a token exists AND is not expired.
 * Decodes the JWT payload client-side (no crypto — just check exp).
 */
export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds, Date.now() is in ms
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// --- Authenticated Fetch Wrapper ---

/**
 * Wraps the native fetch() and automatically injects the Authorization header.
 * If a 401 is returned, it clears the token and fires the onUnauthorized callback.
 */
export function authFetch(
  url: string,
  options: RequestInit = {},
  onUnauthorized?: () => void
): Promise<Response> {
  const token = getToken();
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers }).then((res) => {
    if (res.status === 401) {
      removeToken();
      if (onUnauthorized) onUnauthorized();
    }
    return res;
  });
}
