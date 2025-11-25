// Patient authentication helpers

const PATIENT_SESSION_KEY_PREFIX = 'patient_session_';

/**
 * Check if patient is logged in
 */
export function isPatientLoggedIn(patientId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const sessionStr = localStorage.getItem(`${PATIENT_SESSION_KEY_PREFIX}${patientId}`);
  if (!sessionStr) return false;

  try {
    const session = JSON.parse(sessionStr);
    // Check if session is not expired (7 days)
    const isExpired = Date.now() - session.loginTime > 7 * 24 * 60 * 60 * 1000;
    if (isExpired) {
      logoutPatient(patientId);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Logout patient
 */
export function logoutPatient(patientId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${PATIENT_SESSION_KEY_PREFIX}${patientId}`);
  }
}

/**
 * Get patient session
 */
export function getPatientSession(patientId: string): { patientId: string; loginTime: number } | null {
  if (typeof window === 'undefined') return null;
  
  const sessionStr = localStorage.getItem(`${PATIENT_SESSION_KEY_PREFIX}${patientId}`);
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
}
