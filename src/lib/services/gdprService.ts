/**
 * GDPR Service
 * Handles all GDPR-related operations including data export, deletion, and access requests
 */

import { supabase } from '../supabase';
import { logger } from '../logger';

export interface UserDataExport {
  exportDate: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    preferences: any;
    created_at: string;
    last_login: string | null;
  };
  trips: any[];
  expenses: any[];
  accommodations: any[];
  transportation: any[];
  activities: any[];
  subscriptions: any[];
  aiPreferences: any[];
  processingPurposes: string[];
  dataRetentionPeriod: string;
  thirdPartySharing: ThirdPartyService[];
}

export interface ThirdPartyService {
  name: string;
  purpose: string;
  dataShared: string[];
  privacyPolicy: string;
}

export interface ConsentSettings {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  aiProcessing: boolean;
  thirdPartySharing: boolean;
}

/**
 * Export all user data in JSON format
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  try {
    logger.info('GDPR: Starting data export', { userId });

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Fetch all related data in parallel
    const [
      tripsResult,
      expensesResult,
      accommodationsResult,
      transportationResult,
      activitiesResult,
      subscriptionsResult,
      aiPreferencesResult,
    ] = await Promise.all([
      supabase.from('trips').select('*').eq('owner_id', userId),
      supabase.from('expenses').select('*').eq('paid_by', userId),
      supabase
        .from('accommodations')
        .select('*, trips!inner(owner_id)')
        .eq('trips.owner_id', userId),
      supabase
        .from('transportation')
        .select('*, trips!inner(owner_id)')
        .eq('trips.owner_id', userId),
      supabase
        .from('activities')
        .select('*, itinerary_days!inner(trip_id), trips!inner(owner_id)')
        .eq('trips.owner_id', userId),
      supabase.from('user_subscriptions').select('*').eq('user_id', userId),
      supabase.from('user_ai_preferences').select('*').eq('user_id', userId),
    ]);

    const exportData: UserDataExport = {
      exportDate: new Date().toISOString(),
      user: userData,
      trips: tripsResult.data || [],
      expenses: expensesResult.data || [],
      accommodations: accommodationsResult.data || [],
      transportation: transportationResult.data || [],
      activities: activitiesResult.data || [],
      subscriptions: subscriptionsResult.data || [],
      aiPreferences: aiPreferencesResult.data || [],
      processingPurposes: [
        'Trip planning and management',
        'Expense tracking and splitting',
        'Accommodation and transportation booking management',
        'AI-powered travel recommendations (with consent)',
        'Payment processing via Stripe',
        'Email notifications (with consent)',
        'Service improvement and analytics (with consent)',
      ],
      dataRetentionPeriod: '2 years after account deletion or last activity',
      thirdPartySharing: getThirdPartyServices(),
    };

    logger.info('GDPR: Data export completed', { userId, recordCount: exportData.trips.length });
    return exportData;
  } catch (error) {
    logger.error('GDPR: Data export failed', { userId, error });
    throw error;
  }
}

/**
 * Get list of third-party services that process user data
 */
export function getThirdPartyServices(): ThirdPartyService[] {
  return [
    {
      name: 'Stripe',
      purpose: 'Payment processing and subscription management',
      dataShared: ['Email', 'Name', 'Payment information'],
      privacyPolicy: 'https://stripe.com/privacy',
    },
    {
      name: 'Google Gemini AI',
      purpose: 'AI-powered travel recommendations and itinerary generation',
      dataShared: ['Trip details', 'Preferences', 'Travel history'],
      privacyPolicy: 'https://policies.google.com/privacy',
    },
    {
      name: 'OpenAI',
      purpose: 'AI-powered travel recommendations (alternative provider)',
      dataShared: ['Trip details', 'Preferences', 'Travel history'],
      privacyPolicy: 'https://openai.com/privacy',
    },
    {
      name: 'Mapbox',
      purpose: 'Maps and location services',
      dataShared: ['Location data', 'Map interactions'],
      privacyPolicy: 'https://www.mapbox.com/legal/privacy',
    },
    {
      name: 'Resend',
      purpose: 'Email notifications and communications',
      dataShared: ['Email address', 'Name'],
      privacyPolicy: 'https://resend.com/legal/privacy-policy',
    },
    {
      name: 'Supabase',
      purpose: 'Database and authentication services',
      dataShared: ['All user data stored in the application'],
      privacyPolicy: 'https://supabase.com/privacy',
    },
  ];
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    logger.info('GDPR: Starting account deletion', { userId });

    // Get current user to verify
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || user.id !== userId) {
      throw new Error('Unauthorized: Cannot delete another user\'s account');
    }

    // Delete user from auth (this will cascade to all related tables due to foreign key constraints)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) throw error;

    logger.info('GDPR: Account deletion completed', { userId });
  } catch (error) {
    logger.error('GDPR: Account deletion failed', { userId, error });
    throw error;
  }
}

/**
 * Get user consent settings
 */
export function getConsentSettings(): ConsentSettings {
  if (typeof window === 'undefined') {
    return {
      necessary: true,
      analytics: false,
      marketing: false,
      aiProcessing: false,
      thirdPartySharing: false,
    };
  }

  return {
    necessary: true, // Always true
    analytics: localStorage.getItem('consent-analytics') === 'true',
    marketing: localStorage.getItem('consent-marketing') === 'true',
    aiProcessing: localStorage.getItem('consent-ai') === 'true',
    thirdPartySharing: localStorage.getItem('consent-third-party') === 'true',
  };
}

/**
 * Update user consent settings
 */
export function updateConsentSettings(settings: Partial<ConsentSettings>): void {
  if (typeof window === 'undefined') return;

  if (settings.analytics !== undefined) {
    localStorage.setItem('consent-analytics', String(settings.analytics));
  }
  if (settings.marketing !== undefined) {
    localStorage.setItem('consent-marketing', String(settings.marketing));
  }
  if (settings.aiProcessing !== undefined) {
    localStorage.setItem('consent-ai', String(settings.aiProcessing));
  }
  if (settings.thirdPartySharing !== undefined) {
    localStorage.setItem('consent-third-party', String(settings.thirdPartySharing));
  }

  logger.info('GDPR: Consent settings updated', { settings });
}

/**
 * Check if user has given consent for a specific purpose
 */
export function hasConsent(purpose: keyof ConsentSettings): boolean {
  const settings = getConsentSettings();
  return settings[purpose];
}

/**
 * Anonymize user data (alternative to deletion for legal/audit purposes)
 */
export async function anonymizeUserData(userId: string): Promise<void> {
  try {
    logger.info('GDPR: Starting data anonymization', { userId });

    const anonymousEmail = `deleted_${Date.now()}@voyagesmart.local`;
    
    const { error } = await supabase
      .from('users')
      .update({
        email: anonymousEmail,
        full_name: 'Deleted User',
        avatar_url: null,
        preferences: {},
      })
      .eq('id', userId);

    if (error) throw error;

    logger.info('GDPR: Data anonymization completed', { userId });
  } catch (error) {
    logger.error('GDPR: Data anonymization failed', { userId, error });
    throw error;
  }
}

