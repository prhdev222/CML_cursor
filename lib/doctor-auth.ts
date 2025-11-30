// Doctor authentication utilities

const DOCTOR_SESSION_KEY = 'cml_doctor_session';

export interface DoctorSession {
  doctor_code: string;
  name: string;
  loginTime: number;
}

/**
 * Login doctor user
 */
export async function loginDoctor(doctorCode: string, password: string): Promise<{ success: boolean; error?: string; doctor?: { doctor_code: string; name: string } }> {
  try {
    // Call API route for login
    const response = await fetch('/api/doctor/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ doctor_code: doctorCode, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Login failed' };
    }

    // Create session
    const session: DoctorSession = {
      doctor_code: data.doctor.doctor_code,
      name: data.doctor.name,
      loginTime: Date.now(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(DOCTOR_SESSION_KEY, JSON.stringify(session));
    }

    return { success: true, doctor: data.doctor };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, error: error.message || 'Login failed' };
  }
}

/**
 * Logout doctor
 */
export function logoutDoctor(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DOCTOR_SESSION_KEY);
  }
}

/**
 * Check if doctor is logged in
 */
export function isDoctorLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  const session = localStorage.getItem(DOCTOR_SESSION_KEY);
  if (!session) return false;
  
  try {
    const parsed: DoctorSession = JSON.parse(session);
    // Check if session is not expired (24 hours)
    const hoursSinceLogin = (Date.now() - parsed.loginTime) / (1000 * 60 * 60);
    if (hoursSinceLogin > 24) {
      logoutDoctor();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current doctor session
 */
export function getDoctorSession(): DoctorSession | null {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem(DOCTOR_SESSION_KEY);
  if (!session) return null;
  
  try {
    const parsed: DoctorSession = JSON.parse(session);
    // Check if session is not expired (24 hours)
    const hoursSinceLogin = (Date.now() - parsed.loginTime) / (1000 * 60 * 60);
    if (hoursSinceLogin > 24) {
      logoutDoctor();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}


