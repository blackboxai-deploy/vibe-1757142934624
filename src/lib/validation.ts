import { z } from 'zod';

// URL validation schema
export const urlSchema = z.string()
  .url({ message: 'Please enter a valid URL' })
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, { message: 'URL must use HTTP or HTTPS protocol' });

// Custom short code validation schema
export const customCodeSchema = z.string()
  .min(3, { message: 'Custom code must be at least 3 characters' })
  .max(50, { message: 'Custom code must be no more than 50 characters' })
  .regex(/^[a-zA-Z0-9_-]+$/, { 
    message: 'Custom code can only contain letters, numbers, hyphens, and underscores' 
  });

// Link creation validation schema
export const createLinkSchema = z.object({
  originalUrl: urlSchema,
  customCode: customCodeSchema.optional(),
  title: z.string()
    .max(200, { message: 'Title must be no more than 200 characters' })
    .optional(),
  description: z.string()
    .max(500, { message: 'Description must be no more than 500 characters' })
    .optional(),
  password: z.string()
    .min(4, { message: 'Password must be at least 4 characters' })
    .max(100, { message: 'Password must be no more than 100 characters' })
    .optional(),
  expiresAt: z.string()
    .datetime({ message: 'Please enter a valid date and time' })
    .refine((date) => new Date(date) > new Date(), {
      message: 'Expiration date must be in the future'
    })
    .optional()
});

// Link update validation schema
export const updateLinkSchema = z.object({
  title: z.string()
    .max(200, { message: 'Title must be no more than 200 characters' })
    .optional(),
  description: z.string()
    .max(500, { message: 'Description must be no more than 500 characters' })
    .optional(),
  isActive: z.boolean().optional(),
  password: z.string()
    .min(4, { message: 'Password must be at least 4 characters' })
    .max(100, { message: 'Password must be no more than 100 characters' })
    .optional()
    .nullable(),
  expiresAt: z.string()
    .datetime({ message: 'Please enter a valid date and time' })
    .optional()
    .nullable()
});

// Analytics filter validation schema
export const analyticsFilterSchema = z.object({
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).refine((range) => new Date(range.start) <= new Date(range.end), {
    message: 'Start date must be before or equal to end date'
  }).optional(),
  countries: z.array(z.string()).optional(),
  devices: z.array(z.string()).optional(),
  browsers: z.array(z.string()).optional(),
  referrers: z.array(z.string()).optional(),
  linkIds: z.array(z.string()).optional()
});

// Export data validation schema
export const exportDataSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx'], {
    errorMap: () => ({ message: 'Format must be CSV, JSON, or XLSX' })
  }),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).refine((range) => new Date(range.start) <= new Date(range.end), {
    message: 'Start date must be before or equal to end date'
  }),
  includeDetails: z.boolean(),
  linkIds: z.array(z.string()).optional()
});

// Password verification schema
export const passwordVerificationSchema = z.object({
  password: z.string().min(1, { message: 'Password is required' })
});

// Search validation schema
export const searchSchema = z.object({
  query: z.string()
    .min(1, { message: 'Search query is required' })
    .max(100, { message: 'Search query must be no more than 100 characters' }),
  filters: analyticsFilterSchema.optional()
});

// Bulk link creation schema
export const bulkCreateLinksSchema = z.object({
  links: z.array(z.object({
    originalUrl: urlSchema,
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional()
  })).min(1, { message: 'At least one link is required' })
    .max(100, { message: 'Maximum 100 links can be created at once' })
});

// Coordinate validation
export const coordinateSchema = z.object({
  latitude: z.number()
    .min(-90, { message: 'Latitude must be between -90 and 90' })
    .max(90, { message: 'Latitude must be between -90 and 90' }),
  longitude: z.number()
    .min(-180, { message: 'Longitude must be between -180 and 180' })
    .max(180, { message: 'Longitude must be between -180 and 180' })
});

// Validation helper functions
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    urlSchema.parse(url);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        error: error.errors[0]?.message || 'Invalid URL' 
      };
    }
    return { isValid: false, error: 'Invalid URL' };
  }
}

export function validateCustomCode(code: string): { isValid: boolean; error?: string } {
  try {
    customCodeSchema.parse(code);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        error: error.errors[0]?.message || 'Invalid custom code' 
      };
    }
    return { isValid: false, error: 'Invalid custom code' };
  }
}

export function validateCreateLinkData(data: unknown): { 
  isValid: boolean; 
  data?: z.infer<typeof createLinkSchema>; 
  errors?: string[] 
} {
  try {
    const validatedData = createLinkSchema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        errors: error.errors.map(e => e.message)
      };
    }
    return { isValid: false, errors: ['Invalid data'] };
  }
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters and scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  issues: string[];
} {
  const issues: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  if (password.length < 8) {
    issues.push('Password should be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('Password should contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    issues.push('Password should contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    issues.push('Password should contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('Password should contain at least one special character');
  }
  
  // Determine strength
  if (issues.length === 0) {
    strength = 'strong';
  } else if (issues.length <= 2) {
    strength = 'medium';
  }
  
  return {
    isValid: issues.length === 0,
    strength,
    issues
  };
}

// Rate limiting validation
export function validateRateLimit(
  requests: number, 
  timeWindow: number, 
  maxRequests: number
): { isAllowed: boolean; resetTime?: number } {
  if (requests >= maxRequests) {
    return {
      isAllowed: false,
      resetTime: Date.now() + timeWindow
    };
  }
  
  return { isAllowed: true };
}

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>;
export type ExportDataInput = z.infer<typeof exportDataSchema>;