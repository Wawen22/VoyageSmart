import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { exportUserData } from '@/lib/services/gdprService';
import { logger } from '@/lib/logger';

/**
 * GET /api/gdpr/export-data
 * Export all user data in JSON format (GDPR Right to Data Portability)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      logger.warn('GDPR Export: Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to export your data.' },
        { status: 401 }
      );
    }

    logger.info('GDPR Export: Starting data export', { userId: user.id });

    // Get format from query params (json or csv)
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    // Export user data
    const exportData = await exportUserData(user.id);

    if (format === 'csv') {
      // For CSV, we'll create a simplified version
      const csvData = convertToCSV(exportData);
      
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="voyagesmart-data-${user.id}-${Date.now()}.csv"`,
        },
      });
    }

    // Default: JSON format
    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="voyagesmart-data-${user.id}-${Date.now()}.json"`,
      },
    });

  } catch (error) {
    logger.error('GDPR Export: Failed to export data', { error });
    return NextResponse.json(
      { error: 'Failed to export data. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * Convert export data to CSV format
 */
function convertToCSV(data: any): string {
  const lines: string[] = [];
  
  // Header
  lines.push('VoyageSmart Data Export');
  lines.push(`Export Date: ${data.exportDate}`);
  lines.push('');
  
  // User Information
  lines.push('USER INFORMATION');
  lines.push('Field,Value');
  lines.push(`Email,${data.user.email}`);
  lines.push(`Full Name,${data.user.full_name || 'N/A'}`);
  lines.push(`Account Created,${data.user.created_at}`);
  lines.push(`Last Login,${data.user.last_login || 'N/A'}`);
  lines.push('');
  
  // Trips
  lines.push('TRIPS');
  lines.push('Name,Destination,Start Date,End Date,Budget');
  data.trips.forEach((trip: any) => {
    lines.push(`"${trip.name}","${trip.destination || 'N/A'}",${trip.start_date || 'N/A'},${trip.end_date || 'N/A'},${trip.budget_total || 'N/A'}`);
  });
  lines.push('');
  
  // Expenses
  lines.push('EXPENSES');
  lines.push('Description,Amount,Currency,Date,Category');
  data.expenses.forEach((expense: any) => {
    lines.push(`"${expense.description || 'N/A'}",${expense.amount},${expense.currency},${expense.date},${expense.category || 'N/A'}`);
  });
  lines.push('');
  
  // Subscriptions
  lines.push('SUBSCRIPTIONS');
  lines.push('Tier,Status,Valid Until');
  data.subscriptions.forEach((sub: any) => {
    lines.push(`${sub.tier},${sub.status},${sub.valid_until || 'N/A'}`);
  });
  lines.push('');
  
  // Data Processing Information
  lines.push('DATA PROCESSING PURPOSES');
  data.processingPurposes.forEach((purpose: string) => {
    lines.push(purpose);
  });
  lines.push('');
  
  // Third Party Services
  lines.push('THIRD PARTY DATA SHARING');
  lines.push('Service,Purpose,Privacy Policy');
  data.thirdPartySharing.forEach((service: any) => {
    lines.push(`"${service.name}","${service.purpose}",${service.privacyPolicy}`);
  });
  
  return lines.join('\n');
}

