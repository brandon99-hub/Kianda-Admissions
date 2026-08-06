/**
 * Central authentication utility for the Kianda Admissions Portal.
 *
 * Tokens are now managed as HttpOnly cookies set by the server.
 * JavaScript has NO access to the token value — this eliminates the XSS
 * token-theft attack surface entirely.
 *
 * The browser sends cookies automatically on every same-origin request.
 * All fetch() calls must include `credentials: 'include'` to ensure cookies
 * are sent on cross-origin requests (e.g. during local dev via Vite proxy).
 */

// ── Session Check ─────────────────────────────────────────────────────────────

/**
 * Calls /api/auth/me to determine if the browser has a valid active session.
 * Returns 'admin', 'applicant', or null.
 * Use this on app mount to restore the correct view.
 */
export async function checkSession(): Promise<'admin' | 'applicant' | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.role || null;
  } catch {
    return null;
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────

/** Clears the admin HttpOnly cookie via a server call. */
export async function adminLogout(): Promise<void> {
  await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
}

/** Clears the applicant HttpOnly cookie via a server call. */
export async function applicantLogout(): Promise<void> {
  await fetch('/api/applicants/logout', { method: 'POST', credentials: 'include' });
}

// ── Authenticated Fetch Wrapper ───────────────────────────────────────────────

/**
 * Wraps the native fetch() and ensures credentials (HttpOnly cookies) are
 * always sent. If a 401 is returned, the optional onUnauthorized callback fires.
 */
export function authFetch(
  url: string,
  options: RequestInit = {},
  onUnauthorized?: () => void
): Promise<Response> {
  return fetch(url, { ...options, credentials: 'include' }).then((res) => {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    return res;
  });
}
