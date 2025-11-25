import { NextResponse } from 'next/server';
import os from 'os';

/**
 * API endpoint to get server information including LAN IP address
 * This helps with QR code generation for LAN access
 */
export async function GET() {
  try {
    const networkInterfaces = os.networkInterfaces();
    const lanIps: string[] = [];

    // Find all non-internal IPv4 addresses
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      const addresses = networkInterfaces[interfaceName];
      if (addresses) {
        addresses.forEach((address) => {
          if (address.family === 'IPv4' && !address.internal) {
            lanIps.push(address.address);
          }
        });
      }
    });

    // Get port from environment or default to 3001
    const port = process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3001';
    
    // Get base URL from environment if set
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    return NextResponse.json({
      success: true,
      lanIps,
      port,
      baseUrl: baseUrl || null,
      suggestedUrls: lanIps.map((ip) => `http://${ip}:${port}`),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

