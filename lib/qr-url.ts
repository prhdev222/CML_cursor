/**
 * Utility function to get the base URL for QR codes
 * In development, converts localhost to LAN IP address if available
 */
export function getBaseUrl(): string {
  // Check for environment variable first (for production or custom setup)
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (envUrl) {
      return envUrl;
    }

    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const port = window.location.port || '3001';

    // If using localhost or 127.0.0.1, keep it as is
    // Admin should set NEXT_PUBLIC_BASE_URL for LAN access
    return origin;
  }

  // Server-side fallback
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
}

/**
 * Get patient URL for QR code generation
 * In development, uses LAN IP if available, otherwise uses localhost
 */
export function getPatientUrl(patientId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/patient/${patientId}`;
}

/**
 * Fetch server info including LAN IP addresses
 */
export async function getServerInfo(): Promise<{
  lanIps: string[];
  port: string;
  suggestedUrls: string[];
} | null> {
  try {
    const response = await fetch('/api/get-server-info');
    const data = await response.json();
    if (data.success) {
      return {
        lanIps: data.lanIps,
        port: data.port,
        suggestedUrls: data.suggestedUrls,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching server info:', error);
    return null;
  }
}

