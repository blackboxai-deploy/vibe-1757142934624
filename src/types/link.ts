export interface TrackingLink {
  id: string;
  originalUrl: string;
  shortCode: string;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  expiresAt?: string;
  password?: string;
  userId?: string;
  totalClicks: number;
  uniqueClicks: number;
  lastClickAt?: string;
}

export interface LinkClick {
  id: string;
  linkId: string;
  shortCode: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  referer?: string;
  location: ClickLocation;
  device: DeviceInfo;
  sessionId: string;
}

export interface ClickLocation {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  accuracy?: number; // For browser geolocation
  source: 'ip' | 'browser' | 'both';
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screen?: {
    width: number;
    height: number;
  };
}

export interface LinkStats {
  linkId: string;
  totalClicks: number;
  uniqueClicks: number;
  clicksByDate: Record<string, number>;
  clicksByCountry: Record<string, number>;
  clicksByDevice: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  clicksByReferer: Record<string, number>;
  averageClicksPerDay: number;
  topLocations: Array<{
    country: string;
    clicks: number;
    percentage: number;
  }>;
  recentClicks: LinkClick[];
}

export interface CreateLinkRequest {
  originalUrl: string;
  customCode?: string;
  title?: string;
  description?: string;
  password?: string;
  expiresAt?: string;
}

export interface LinkResponse {
  success: boolean;
  data?: TrackingLink;
  error?: string;
  shortUrl?: string;
}