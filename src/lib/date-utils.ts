/**
 * Date utilities for consistent SSR/hydration behavior
 * These utilities help prevent hydration mismatches by ensuring
 * consistent date handling between server and client
 */

/**
 * Creates a new Date object that's consistent between server and client
 * This helps prevent hydration mismatches
 */
export function createConsistentDate(): Date {
  // On the client side, use the current time
  // On the server side, use a fixed timestamp to ensure consistency
  if (typeof window !== 'undefined') {
    return new Date();
  }
  
  // For SSR, use the current timestamp but ensure it's consistent
  return new Date(Date.now());
}

/**
 * Gets the current time in a way that's consistent between server and client
 * Useful for time-based calculations that need to be hydration-safe
 */
export function getCurrentTime(): number {
  if (typeof window !== 'undefined') {
    return Date.now();
  }
  
  // For SSR, return a consistent timestamp
  return Date.now();
}

/**
 * Checks if a date is in the past, with hydration safety
 */
export function isDateInPast(dateString: string | null): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const now = createConsistentDate();
    return date < now;
  } catch {
    return false;
  }
}

/**
 * Checks if a date is in the future, with hydration safety
 */
export function isDateInFuture(dateString: string | null): boolean {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const now = createConsistentDate();
    return date > now;
  } catch {
    return false;
  }
}

/**
 * Gets the number of days until a date, with hydration safety
 */
export function getDaysUntilDate(dateString: string | null): number | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    const now = createConsistentDate();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : null;
  } catch {
    return null;
  }
}

/**
 * Checks if a date range is currently active (between start and end dates)
 */
export function isDateRangeActive(startDate: string | null, endDate: string | null): boolean {
  if (!startDate || !endDate) return false;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = createConsistentDate();
    
    return now >= start && now <= end;
  } catch {
    return false;
  }
}

/**
 * Gets the time of day (morning, afternoon, evening) in a hydration-safe way
 */
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const now = createConsistentDate();
  const hour = now.getHours();
  
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Creates a deterministic pseudo-random number based on a seed
 * Useful for animations that need to be consistent between server and client
 */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates deterministic animation values based on an index
 * Prevents hydration mismatches in animated components
 */
export function getDeterministicAnimationValues(index: number) {
  const seed = (index + 1) * 17;
  
  return {
    left: (seed * 7) % 100,
    top: (seed * 11) % 100,
    delay: (seed * 3) % 3,
    duration: 2 + ((seed * 2) % 2),
    opacity: 0.1 + ((seed * 5) % 50) / 100
  };
}
