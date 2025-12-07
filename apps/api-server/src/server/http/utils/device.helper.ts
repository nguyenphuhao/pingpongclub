import { NextRequest } from 'next/server';
import { DeviceInfo, RequestInfo } from '@/server/modules/auth/application/login-history.service';
import { DevicePlatform } from '@/shared/types';

/**
 * Extract device info from request
 * Helper function để extract device information từ HTTP request
 */

export function extractDeviceInfo(request: NextRequest, body?: any): {
  deviceInfo: DeviceInfo;
  requestInfo: RequestInfo;
} {
  // Extract from headers
  const userAgent = request.headers.get('user-agent') || undefined;
  
  // Extract IP address (check various headers)
  const ipAddress = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    undefined;

  // Extract from body if provided
  const deviceInfoFromBody = body?.deviceInfo || {};

  // Determine platform
  let platform: DevicePlatform = DevicePlatform.WEB;
  if (deviceInfoFromBody.platform) {
    platform = deviceInfoFromBody.platform as DevicePlatform;
  } else if (userAgent) {
    // Try to detect from user agent
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      platform = DevicePlatform.IOS;
    } else if (ua.includes('android')) {
      platform = DevicePlatform.ANDROID;
    }
  }

  const deviceInfo: DeviceInfo = {
    platform,
    deviceId: deviceInfoFromBody.deviceId,
    deviceModel: deviceInfoFromBody.model || deviceInfoFromBody.deviceModel,
    osVersion: deviceInfoFromBody.osVersion,
  };

  const requestInfo: RequestInfo = {
    ipAddress,
    userAgent,
    location: deviceInfoFromBody.location, // Optional, can be set by client or geolocation service
  };

  return { deviceInfo, requestInfo };
}

