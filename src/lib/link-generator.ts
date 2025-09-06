import { TrackingLink } from '@/types/link';
import { getLinkByShortCode } from './database';

// Characters for generating short codes
const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const SHORT_CODE_LENGTH = 8;

/**
 * Generate a random short code
 */
function generateRandomCode(length: number = SHORT_CODE_LENGTH): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return result;
}

/**
 * Generate a unique short code that doesn't already exist
 */
export async function generateUniqueShortCode(customCode?: string): Promise<string> {
  // If custom code is provided, check if it's available
  if (customCode) {
    const existing = await getLinkByShortCode(customCode);
    if (existing) {
      throw new Error('Custom short code already exists');
    }
    return customCode;
  }
  
  // Generate random code and check uniqueness
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateRandomCode();
    const existing = await getLinkByShortCode(code);
    
    if (!existing) {
      return code;
    }
    
    attempts++;
  }
  
  // If we couldn't generate a unique code, try with longer length
  const longerCode = generateRandomCode(SHORT_CODE_LENGTH + 2);
  const existing = await getLinkByShortCode(longerCode);
  
  if (!existing) {
    return longerCode;
  }
  
  throw new Error('Unable to generate unique short code');
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate custom short code format
 */
export function isValidCustomCode(code: string): boolean {
  // Allow alphanumeric characters, hyphens, and underscores
  const regex = /^[a-zA-Z0-9_-]+$/;
  return regex.test(code) && code.length >= 3 && code.length <= 50;
}

/**
 * Create a new tracking link
 */
export function createTrackingLink(
  originalUrl: string,
  shortCode: string,
  options: {
    title?: string;
    description?: string;
    password?: string;
    expiresAt?: string;
    userId?: string;
  } = {}
): TrackingLink {
  const now = new Date().toISOString();
  
  return {
    id: generateId(),
    originalUrl,
    shortCode,
    title: options.title,
    description: options.description,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    expiresAt: options.expiresAt,
    password: options.password,
    userId: options.userId,
    totalClicks: 0,
    uniqueClicks: 0
  };
}

/**
 * Generate a unique ID for links and clicks
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Check if a link is expired
 */
export function isLinkExpired(link: TrackingLink): boolean {
  if (!link.expiresAt) return false;
  return new Date(link.expiresAt) < new Date();
}

/**
 * Check if a link requires password
 */
export function isPasswordProtected(link: TrackingLink): boolean {
  return !!link.password;
}

/**
 * Validate password for protected link
 */
export function validateLinkPassword(link: TrackingLink, password: string): boolean {
  if (!link.password) return true;
  return link.password === password;
}

/**
 * Generate full tracking URL
 */
export function generateTrackingUrl(shortCode: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  return `${base}/r/${shortCode}`;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Sanitize URL for safety
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove potential XSS vectors
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      throw new Error('Invalid URL protocol');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Generate QR code data URL (placeholder for now)
 */
export function generateQRCodeDataUrl(url: string): string {
  // In a real implementation, you would use a QR code library
  // For now, return a placeholder
  return `https://placehold.co/200x200?text=QR+Code+for+${encodeURIComponent(url)}`;
}