import { GeolocationResult, LocationPermission } from '@/types/geo';

/**
 * Get IP-based geolocation using a free service
 */
export async function getIPGeolocation(ip: string): Promise<GeolocationResult> {
  try {
    // Using ipapi.co free service (100 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch IP geolocation');
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.reason || 'IP geolocation service error');
    }
    
    return {
      country: data.country_name,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      isp: data.org,
      source: 'ip'
    };
  } catch (error) {
    console.error('IP Geolocation error:', error);
    return {
      source: 'ip',
      error: error instanceof Error ? error.message : 'Failed to get IP location'
    };
  }
}

/**
 * Get geolocation using browser API (client-side only)
 */
export async function getBrowserGeolocation(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        source: 'browser',
        error: 'Geolocation not supported by browser'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'browser'
        });
      },
      (error) => {
        let errorMessage = 'Unknown geolocation error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Geolocation permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Geolocation request timed out';
            break;
        }
        
        resolve({
          source: 'browser',
          error: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

/**
 * Check geolocation permission status
 */
export async function checkLocationPermission(): Promise<LocationPermission> {
  if (!navigator.permissions) {
    return {
      granted: false,
      denied: false,
      prompt: true,
      error: 'Permissions API not supported'
    };
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    
    return {
      granted: permission.state === 'granted',
      denied: permission.state === 'denied',
      prompt: permission.state === 'prompt'
    };
  } catch (error) {
    return {
      granted: false,
      denied: false,
      prompt: true,
      error: error instanceof Error ? error.message : 'Failed to check permission'
    };
  }
}

/**
 * Get client IP address (server-side)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  // Fallback for development
  return '127.0.0.1';
}

/**
 * Combine IP and browser geolocation data
 */
export async function getCombinedGeolocation(
  ipLocation: GeolocationResult,
  browserLocation?: GeolocationResult
): Promise<GeolocationResult> {
  if (!browserLocation || browserLocation.error) {
    return ipLocation;
  }
  
  if (ipLocation.error) {
    return browserLocation;
  }
  
  // Combine both sources, preferring browser accuracy for coordinates
  return {
    country: ipLocation.country,
    countryCode: ipLocation.countryCode,
    region: ipLocation.region,
    city: ipLocation.city,
    latitude: browserLocation.latitude || ipLocation.latitude,
    longitude: browserLocation.longitude || ipLocation.longitude,
    timezone: ipLocation.timezone,
    isp: ipLocation.isp,
    accuracy: browserLocation.accuracy,
    source: 'both'
  };
}

/**
 * Reverse geocoding - get address from coordinates
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeolocationResult> {
  try {
    // Using a free reverse geocoding service
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    
    return {
      country: data.countryName,
      countryCode: data.countryCode,
      region: data.principalSubdivision,
      city: data.city || data.locality,
      latitude: lat,
      longitude: lng,
      source: 'browser'
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      latitude: lat,
      longitude: lng,
      source: 'browser',
      error: error instanceof Error ? error.message : 'Reverse geocoding failed'
    };
  }
}

/**
 * Calculate distance between two coordinates (in km)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get timezone from coordinates
 */
export async function getTimezoneFromCoords(lat: number, lng: number): Promise<string> {
  try {
    // Using a free timezone API
    const response = await fetch(
      `https://api.timezonedb.com/v2.1/get-time-zone?key=demo&format=json&by=position&lat=${lat}&lng=${lng}`
    );
    
    if (!response.ok) {
      throw new Error('Timezone lookup failed');
    }
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.zoneName;
    }
    
    throw new Error(data.message || 'Timezone lookup failed');
  } catch (error) {
    console.error('Timezone lookup error:', error);
    // Fallback to browser timezone
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

/**
 * Validate coordinates
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
    
  return String.fromCodePoint(...codePoints);
}