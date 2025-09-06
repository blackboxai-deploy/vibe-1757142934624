export interface IPGeolocationResponse {
  ip: string;
  country: string;
  country_code: string;
  region: string;
  region_code: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  organization: string;
  success: boolean;
  error?: string;
}

export interface BrowserGeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GeolocationResult {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  accuracy?: number;
  source: 'ip' | 'browser' | 'both';
  error?: string;
}

export interface LocationPermission {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  error?: string;
}

export interface GeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
}

export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  clicks: number;
  country: string;
  city: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface CountryStats {
  code: string;
  name: string;
  clicks: number;
  percentage: number;
  flag: string;
  coordinates: [number, number];
}