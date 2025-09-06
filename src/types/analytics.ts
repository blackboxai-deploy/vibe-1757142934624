export interface AnalyticsOverview {
  totalLinks: number;
  totalClicks: number;
  uniqueClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  topPerformingLinks: Array<{
    id: string;
    title: string;
    shortCode: string;
    clicks: number;
  }>;
  recentActivity: Array<{
    linkId: string;
    shortCode: string;
    clicks: number;
    timestamp: string;
    location?: string;
  }>;
}

export interface GeographyData {
  countries: Array<{
    code: string;
    name: string;
    clicks: number;
    percentage: number;
    coordinates: [number, number];
  }>;
  cities: Array<{
    name: string;
    country: string;
    clicks: number;
    coordinates: [number, number];
  }>;
  totalCountries: number;
  topCountry: string;
}

export interface TimeSeriesData {
  date: string;
  clicks: number;
  uniqueClicks: number;
  bounceRate?: number;
}

export interface DeviceAnalytics {
  devices: Array<{
    type: string;
    clicks: number;
    percentage: number;
  }>;
  browsers: Array<{
    name: string;
    clicks: number;
    percentage: number;
  }>;
  operatingSystems: Array<{
    name: string;
    clicks: number;
    percentage: number;
  }>;
}

export interface ReferrerData {
  referrers: Array<{
    source: string;
    clicks: number;
    percentage: number;
    domain: string;
  }>;
  directTraffic: number;
  socialMedia: number;
  searchEngines: number;
  other: number;
}

export interface ExportData {
  format: 'csv' | 'json' | 'xlsx';
  dateRange: {
    start: string;
    end: string;
  };
  includeDetails: boolean;
  linkIds?: string[];
}

export interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  countries?: string[];
  devices?: string[];
  browsers?: string[];
  referrers?: string[];
  linkIds?: string[];
}