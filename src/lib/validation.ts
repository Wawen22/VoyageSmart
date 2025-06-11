import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods');

export const uuidSchema = z.string().uuid('Invalid UUID format');

// Sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
}

export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  
  return email
    .trim()
    .toLowerCase()
    .slice(0, 254); // RFC 5321 limit
}

export function sanitizeNumber(input: any): number | null {
  const num = Number(input);
  return isNaN(num) ? null : num;
}

// Trip validation schemas
export const tripSchema = z.object({
  name: z.string()
    .min(1, 'Trip name is required')
    .max(100, 'Trip name must be less than 100 characters')
    .transform(sanitizeString),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(val => val ? sanitizeString(val) : undefined),
  start_date: z.string().datetime('Invalid start date format'),
  end_date: z.string().datetime('Invalid end date format'),
  destination: z.string()
    .min(1, 'Destination is required')
    .max(100, 'Destination must be less than 100 characters')
    .transform(sanitizeString),
  budget: z.number()
    .positive('Budget must be positive')
    .max(1000000, 'Budget too large')
    .optional(),
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters')
    .optional(),
});

// Activity validation schema
export const activitySchema = z.object({
  name: z.string()
    .min(1, 'Activity name is required')
    .max(200, 'Activity name must be less than 200 characters')
    .transform(sanitizeString),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .transform(val => val ? sanitizeString(val) : undefined),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters')
    .transform(sanitizeString),
  start_time: z.string().datetime('Invalid start time format'),
  end_time: z.string().datetime('Invalid end time format'),
  type: z.enum(['sightseeing', 'restaurant', 'activity', 'transport', 'accommodation', 'other']),
  cost: z.number()
    .min(0, 'Cost cannot be negative')
    .max(100000, 'Cost too large')
    .optional(),
  trip_id: uuidSchema,
});

// Accommodation validation schema
export const accommodationSchema = z.object({
  name: z.string()
    .min(1, 'Accommodation name is required')
    .max(200, 'Accommodation name must be less than 200 characters')
    .transform(sanitizeString),
  type: z.enum(['hotel', 'hostel', 'apartment', 'house', 'other']),
  address: z.string()
    .min(1, 'Address is required')
    .max(300, 'Address must be less than 300 characters')
    .transform(sanitizeString),
  check_in: z.string().datetime('Invalid check-in date format'),
  check_out: z.string().datetime('Invalid check-out date format'),
  price_per_night: z.number()
    .min(0, 'Price cannot be negative')
    .max(10000, 'Price too large')
    .optional(),
  total_price: z.number()
    .min(0, 'Total price cannot be negative')
    .max(100000, 'Total price too large')
    .optional(),
  trip_id: uuidSchema,
});

// Transportation validation schema
export const transportationSchema = z.object({
  type: z.enum(['flight', 'train', 'bus', 'car', 'boat', 'other']),
  company: z.string()
    .max(100, 'Company name must be less than 100 characters')
    .optional()
    .transform(val => val ? sanitizeString(val) : undefined),
  departure_location: z.string()
    .min(1, 'Departure location is required')
    .max(200, 'Departure location must be less than 200 characters')
    .transform(sanitizeString),
  arrival_location: z.string()
    .min(1, 'Arrival location is required')
    .max(200, 'Arrival location must be less than 200 characters')
    .transform(sanitizeString),
  departure_time: z.string().datetime('Invalid departure time format'),
  arrival_time: z.string().datetime('Invalid arrival time format'),
  price: z.number()
    .min(0, 'Price cannot be negative')
    .max(100000, 'Price too large')
    .optional(),
  trip_id: uuidSchema,
});

// Expense validation schema
export const expenseSchema = z.object({
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters')
    .transform(sanitizeString),
  amount: z.number()
    .positive('Amount must be positive')
    .max(100000, 'Amount too large'),
  category: z.enum(['accommodation', 'transportation', 'food', 'activities', 'shopping', 'other']),
  date: z.string().datetime('Invalid date format'),
  trip_id: uuidSchema,
});

// Auth validation schemas
export const signUpSchema = z.object({
  email: emailSchema.transform(sanitizeEmail),
  password: passwordSchema,
  full_name: nameSchema,
});

export const signInSchema = z.object({
  email: emailSchema.transform(sanitizeEmail),
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema.transform(sanitizeEmail),
});

// AI Chat validation schema
export const aiChatSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be less than 2000 characters')
    .transform(sanitizeString),
  trip_id: uuidSchema.optional(),
});

// Generic validation function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// SQL injection prevention - check for suspicious patterns
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(--|\/\*|\*\/)/,
    /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\()/i,
    /(\b(WAITFOR|DELAY)\b)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// XSS prevention - check for suspicious patterns
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]+src[^>]*>/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

// Comprehensive security validation
export function validateSecurity(input: string): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (detectSQLInjection(input)) {
    issues.push('Potential SQL injection detected');
  }
  
  if (detectXSS(input)) {
    issues.push('Potential XSS attack detected');
  }
  
  return {
    safe: issues.length === 0,
    issues,
  };
}
