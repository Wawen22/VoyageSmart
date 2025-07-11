import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not set';

  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a timestamp to local time in Italian format (HH:MM)
 * Handles both ISO strings and timestamp strings correctly
 */
export function formatTimeLocal(timeString: string | null): string {
  if (!timeString) return '';

  try {
    const date = new Date(timeString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return timeString;
    }

    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Rome' // Ensure Italian timezone
    });
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeString;
  }
}

/**
 * Formats a timestamp to local date and time in Italian format
 */
export function formatDateTimeLocal(dateTimeString: string | null): string {
  if (!dateTimeString) return '';

  try {
    const date = new Date(dateTimeString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return dateTimeString;
    }

    return date.toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Rome' // Ensure Italian timezone
    });
  } catch (e) {
    console.error('Error formatting date time:', e);
    return dateTimeString;
  }
}

/**
 * Formats a date to Italian format (DD/MM/YYYY)
 */
export function formatDateLocal(dateString: string | null): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Europe/Rome' // Ensure Italian timezone
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
}
