// Simple session management using localStorage
const ADMIN_SESSION_KEY = 'cml_admin_session';

export interface AdminSession {
  username: string;
  loginTime: number;
}

/**
 * Login admin user
 */
export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Call API route for login
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Login failed' };
    }

    // Create session
    const session: AdminSession = {
      username: data.username,
      loginTime: Date.now(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    }

    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message || 'Login failed' };
  }
}

/**
 * Logout admin
 */
export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

/**
 * Check if admin is logged in
 */
export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  
  const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!sessionStr) return false;

  try {
    const session: AdminSession = JSON.parse(sessionStr);
    // Check if session is not expired (24 hours)
    const isExpired = Date.now() - session.loginTime > 24 * 60 * 60 * 1000;
    if (isExpired) {
      logoutAdmin();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current admin session
 */
export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  
  const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
}
