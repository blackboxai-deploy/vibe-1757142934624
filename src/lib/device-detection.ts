import { DeviceInfo } from '@/types/link';

/**
 * Parse user agent string to extract device information
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();
  
  // Detect device type
  const deviceType = getDeviceType(ua);
  
  // Detect browser
  const { browser, browserVersion } = getBrowserInfo(ua);
  
  // Detect operating system
  const { os, osVersion } = getOSInfo(ua);
  
  return {
    type: deviceType,
    browser,
    browserVersion,
    os,
    osVersion
  };
}

/**
 * Detect device type from user agent
 */
function getDeviceType(ua: string): DeviceInfo['type'] {
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  if (/desktop|windows|macintosh|linux/i.test(ua)) {
    return 'desktop';
  }
  
  return 'unknown';
}

/**
 * Extract browser information from user agent
 */
function getBrowserInfo(ua: string): { browser: string; browserVersion: string } {
  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  
  // Chrome (check before Safari as Chrome includes Safari in UA)
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  }
  // Firefox
  else if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  }
  // Safari (after Chrome check)
  else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/(\d+)/);
    if (match) browserVersion = match[1];
  }
  // Edge
  else if (ua.includes('edg')) {
    browser = 'Edge';
    const match = ua.match(/edg\/(\d+)/);
    if (match) browserVersion = match[1];
  }
  // Internet Explorer
  else if (ua.includes('trident') || ua.includes('msie')) {
    browser = 'Internet Explorer';
    const match = ua.match(/(?:msie |rv:)(\d+)/);
    if (match) browserVersion = match[1];
  }
  // Opera
  else if (ua.includes('opr') || ua.includes('opera')) {
    browser = 'Opera';
    const match = ua.match(/(?:opr|opera)\/(\d+)/);
    if (match) browserVersion = match[1];
  }
  
  return { browser, browserVersion };
}

/**
 * Extract operating system information from user agent
 */
function getOSInfo(ua: string): { os: string; osVersion: string } {
  let os = 'Unknown';
  let osVersion = 'Unknown';
  
  // Windows
  if (ua.includes('windows')) {
    os = 'Windows';
    if (ua.includes('windows nt 10.0')) osVersion = '10/11';
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
    else if (ua.includes('windows nt 6.2')) osVersion = '8';
    else if (ua.includes('windows nt 6.1')) osVersion = '7';
    else if (ua.includes('windows nt 6.0')) osVersion = 'Vista';
    else if (ua.includes('windows nt 5.1')) osVersion = 'XP';
  }
  // macOS
  else if (ua.includes('mac os x')) {
    os = 'macOS';
    const match = ua.match(/mac os x (\d+)[._](\d+)/);
    if (match) osVersion = `${match[1]}.${match[2]}`;
  }
  // iOS
  else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = ua.includes('ipad') ? 'iPadOS' : 'iOS';
    const match = ua.match(/os (\d+)[._](\d+)/);
    if (match) osVersion = `${match[1]}.${match[2]}`;
  }
  // Android
  else if (ua.includes('android')) {
    os = 'Android';
    const match = ua.match(/android (\d+)\.(\d+)/);
    if (match) osVersion = `${match[1]}.${match[2]}`;
  }
  // Linux
  else if (ua.includes('linux')) {
    os = 'Linux';
    if (ua.includes('ubuntu')) osVersion = 'Ubuntu';
    else if (ua.includes('fedora')) osVersion = 'Fedora';
    else if (ua.includes('debian')) osVersion = 'Debian';
  }
  
  return { os, osVersion };
}

/**
 * Generate a session ID for tracking unique visitors
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2);
  return `session_${timestamp}_${random}`;
}

/**
 * Check if the device is mobile
 */
export function isMobileDevice(userAgent: string): boolean {
  const deviceType = getDeviceType(userAgent.toLowerCase());
  return deviceType === 'mobile';
}

/**
 * Check if the device is a bot/crawler
 */
export function isBot(userAgent: string): boolean {
  const botPatterns = [
    'bot', 'crawler', 'spider', 'crawling',
    'facebook', 'twitter', 'google', 'bing',
    'yahoo', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'facebookexternalhit', 'twitterbot',
    'linkedinbot', 'whatsapp', 'telegram', 'skype'
  ];
  
  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}

/**
 * Get screen resolution from client-side (to be used with browser API)
 */
export function getScreenResolution(): { width: number; height: number } | undefined {
  if (typeof window !== 'undefined' && window.screen) {
    return {
      width: window.screen.width,
      height: window.screen.height
    };
  }
  return undefined;
}

/**
 * Get viewport size from client-side
 */
export function getViewportSize(): { width: number; height: number } | undefined {
  if (typeof window !== 'undefined') {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }
  return undefined;
}

/**
 * Get detailed device capabilities (client-side only)
 */
export function getDeviceCapabilities(): {
  touchSupport: boolean;
  cookieEnabled: boolean;
  language: string;
  languages: string[];
  timezone: string;
  colorDepth: number;
  pixelRatio: number;
} | undefined {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    return {
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      cookieEnabled: navigator.cookieEnabled,
      language: navigator.language,
      languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorDepth: window.screen?.colorDepth || 24,
      pixelRatio: window.devicePixelRatio || 1
    };
  }
  return undefined;
}

/**
 * Parse referer URL to get domain and source type
 */
export function parseReferer(referer?: string): {
  domain: string;
  sourceType: 'direct' | 'search' | 'social' | 'email' | 'other';
  searchEngine?: string;
  socialPlatform?: string;
} {
  if (!referer) {
    return { domain: 'direct', sourceType: 'direct' };
  }
  
  try {
    const url = new URL(referer);
    const domain = url.hostname.toLowerCase();
    
    // Search engines
    const searchEngines = {
      'google.com': 'Google',
      'bing.com': 'Bing',
      'yahoo.com': 'Yahoo',
      'duckduckgo.com': 'DuckDuckGo',
      'yandex.com': 'Yandex',
      'baidu.com': 'Baidu'
    };
    
    for (const [searchDomain, engineName] of Object.entries(searchEngines)) {
      if (domain.includes(searchDomain)) {
        return {
          domain,
          sourceType: 'search',
          searchEngine: engineName
        };
      }
    }
    
    // Social media platforms
    const socialPlatforms = {
      'facebook.com': 'Facebook',
      'twitter.com': 'Twitter',
      'linkedin.com': 'LinkedIn',
      'instagram.com': 'Instagram',
      'youtube.com': 'YouTube',
      'tiktok.com': 'TikTok',
      'pinterest.com': 'Pinterest',
      'reddit.com': 'Reddit',
      'discord.com': 'Discord',
      'telegram.org': 'Telegram',
      'whatsapp.com': 'WhatsApp'
    };
    
    for (const [socialDomain, platformName] of Object.entries(socialPlatforms)) {
      if (domain.includes(socialDomain)) {
        return {
          domain,
          sourceType: 'social',
          socialPlatform: platformName
        };
      }
    }
    
    // Email clients
    if (domain.includes('mail.') || domain.includes('gmail.') || domain.includes('outlook.')) {
      return { domain, sourceType: 'email' };
    }
    
    return { domain, sourceType: 'other' };
    
  } catch (error) {
    return { domain: 'unknown', sourceType: 'other' };
  }
}