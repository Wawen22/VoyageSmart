# Cron Job Setup

This document outlines the setup and management of scheduled tasks (cron jobs) in VoyageSmart for automated maintenance, data processing, and system operations.

## Overview

VoyageSmart uses various scheduled tasks to maintain system health, process data, send notifications, and perform routine maintenance operations. These tasks are implemented using cron jobs and scheduled functions.

## Cron Job Architecture

### Task Categories

**System Maintenance**
- Database cleanup and optimization
- Log rotation and archival
- Cache invalidation and cleanup
- File system maintenance
- Security scans and updates

**Data Processing**
- User analytics aggregation
- Expense report generation
- Trip data synchronization
- AI model training data preparation
- Backup operations

**User Communications**
- Email notifications and reminders
- Push notification delivery
- Newsletter and marketing emails
- Trip reminder notifications
- Subscription renewal notices

**External Integrations**
- Third-party API synchronization
- Exchange rate updates
- Weather data updates
- Travel advisory updates
- Payment processing reconciliation

## Implementation Methods

### 1. Vercel Cron Jobs

**Configuration (vercel.json)**
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/update-exchange-rates",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/backup-data",
      "schedule": "0 1 * * 0"
    }
  ]
}
```

**API Route Implementation**
```typescript
// /api/cron/daily-cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify cron job authentication
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Perform daily cleanup tasks
    await performDailyCleanup();

    return NextResponse.json({ 
      success: true, 
      message: 'Daily cleanup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Daily cleanup failed:', error);
    return NextResponse.json({ 
      error: 'Cleanup failed',
      details: error.message 
    }, { status: 500 });
  }
}

async function performDailyCleanup() {
  // Clean expired sessions
  await cleanExpiredSessions();
  
  // Remove temporary files
  await cleanTempFiles();
  
  // Update user statistics
  await updateUserStatistics();
  
  // Optimize database
  await optimizeDatabase();
}
```

### 2. Supabase Edge Functions

**Function Setup**
```typescript
// supabase/functions/scheduled-tasks/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  try {
    const { task } = await req.json();
    
    switch (task) {
      case 'send_trip_reminders':
        await sendTripReminders();
        break;
      case 'process_analytics':
        await processAnalytics();
        break;
      case 'cleanup_old_data':
        await cleanupOldData();
        break;
      default:
        throw new Error(`Unknown task: ${task}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, task }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**Cron Configuration (pg_cron)**
```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily trip reminders
SELECT cron.schedule(
  'send-trip-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/scheduled-tasks',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}',
    body := '{"task": "send_trip_reminders"}'
  );
  $$
);

-- Schedule weekly analytics processing
SELECT cron.schedule(
  'process-analytics',
  '0 2 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/scheduled-tasks',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}',
    body := '{"task": "process_analytics"}'
  );
  $$
);
```

## Scheduled Tasks

### Daily Tasks

**1. Database Cleanup (2:00 AM)**
```typescript
async function dailyDatabaseCleanup() {
  const tasks = [
    // Clean expired sessions
    {
      name: 'expired_sessions',
      query: `DELETE FROM user_sessions WHERE expires_at < NOW()`
    },
    
    // Remove old audit logs (older than 90 days)
    {
      name: 'old_audit_logs',
      query: `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'`
    },
    
    // Clean temporary uploads (older than 24 hours)
    {
      name: 'temp_uploads',
      query: `DELETE FROM temp_uploads WHERE created_at < NOW() - INTERVAL '24 hours'`
    },
    
    // Update user activity statistics
    {
      name: 'user_stats',
      query: `
        INSERT INTO user_daily_stats (user_id, date, login_count, trip_views, expenses_added)
        SELECT 
          user_id,
          CURRENT_DATE - 1,
          COUNT(DISTINCT session_id),
          COUNT(DISTINCT CASE WHEN action = 'view_trip' THEN resource_id END),
          COUNT(DISTINCT CASE WHEN action = 'add_expense' THEN resource_id END)
        FROM user_activities 
        WHERE created_at >= CURRENT_DATE - 1 
        AND created_at < CURRENT_DATE
        GROUP BY user_id
        ON CONFLICT (user_id, date) DO UPDATE SET
          login_count = EXCLUDED.login_count,
          trip_views = EXCLUDED.trip_views,
          expenses_added = EXCLUDED.expenses_added
      `
    }
  ];

  for (const task of tasks) {
    try {
      await supabase.rpc('execute_sql', { sql: task.query });
      console.log(`✅ Completed: ${task.name}`);
    } catch (error) {
      console.error(`❌ Failed: ${task.name}`, error);
    }
  }
}
```

**2. Send Trip Reminders (9:00 AM)**
```typescript
async function sendTripReminders() {
  // Get trips starting in 7 days
  const { data: upcomingTrips } = await supabase
    .from('trips')
    .select(`
      id,
      title,
      start_date,
      users!inner(id, email, name)
    `)
    .gte('start_date', new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString())
    .lt('start_date', new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString());

  // Get trips starting tomorrow
  const { data: tomorrowTrips } = await supabase
    .from('trips')
    .select(`
      id,
      title,
      start_date,
      users!inner(id, email, name)
    `)
    .gte('start_date', new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString())
    .lt('start_date', new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString());

  // Send 7-day reminders
  for (const trip of upcomingTrips || []) {
    await sendEmail({
      to: trip.users.email,
      subject: `Your trip to ${trip.title} is coming up!`,
      template: 'trip-reminder-7-days',
      data: {
        userName: trip.users.name,
        tripTitle: trip.title,
        startDate: trip.start_date,
        tripUrl: `${process.env.NEXT_PUBLIC_APP_URL}/trips/${trip.id}`
      }
    });
  }

  // Send tomorrow reminders
  for (const trip of tomorrowTrips || []) {
    await sendEmail({
      to: trip.users.email,
      subject: `Your trip starts tomorrow!`,
      template: 'trip-reminder-tomorrow',
      data: {
        userName: trip.users.name,
        tripTitle: trip.title,
        startDate: trip.start_date,
        tripUrl: `${process.env.NEXT_PUBLIC_APP_URL}/trips/${trip.id}`
      }
    });
  }
}
```

### Hourly Tasks

**Exchange Rate Updates (Every 6 hours)**
```typescript
async function updateExchangeRates() {
  try {
    // Fetch latest rates from external API
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD?access_key=${process.env.EXCHANGE_API_KEY}`);
    const data = await response.json();

    if (data.success) {
      // Update rates in database
      await supabase
        .from('exchange_rates')
        .upsert({
          base_currency: 'USD',
          rates: data.rates,
          updated_at: new Date().toISOString()
        });

      console.log('✅ Exchange rates updated successfully');
    }
  } catch (error) {
    console.error('❌ Failed to update exchange rates:', error);
  }
}
```

### Weekly Tasks

**1. Data Backup (Sunday 1:00 AM)**
```typescript
async function performWeeklyBackup() {
  const backupTasks = [
    {
      name: 'user_data',
      tables: ['users', 'user_profiles', 'user_preferences']
    },
    {
      name: 'trip_data',
      tables: ['trips', 'trip_members', 'itinerary_items', 'expenses']
    },
    {
      name: 'system_data',
      tables: ['audit_logs', 'user_sessions', 'notifications']
    }
  ];

  for (const backup of backupTasks) {
    try {
      // Create backup using pg_dump equivalent
      const backupData = await createTableBackup(backup.tables);
      
      // Upload to cloud storage
      await uploadBackup(`weekly_backup_${backup.name}_${new Date().toISOString().split('T')[0]}.sql`, backupData);
      
      console.log(`✅ Backup completed: ${backup.name}`);
    } catch (error) {
      console.error(`❌ Backup failed: ${backup.name}`, error);
    }
  }
}
```

**2. Analytics Processing (Monday 2:00 AM)**
```typescript
async function processWeeklyAnalytics() {
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Calculate weekly metrics
  const metrics = await calculateWeeklyMetrics(lastWeek);
  
  // Store in analytics table
  await supabase
    .from('weekly_analytics')
    .insert({
      week_start: lastWeek.toISOString(),
      total_users: metrics.totalUsers,
      active_users: metrics.activeUsers,
      new_trips: metrics.newTrips,
      total_expenses: metrics.totalExpenses,
      revenue: metrics.revenue
    });

  // Generate and send admin report
  await sendAdminReport('weekly', metrics);
}
```

### Monthly Tasks

**Subscription Management (1st of month, 3:00 AM)**
```typescript
async function processMonthlySubscriptions() {
  // Process subscription renewals
  const { data: renewals } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .lte('next_billing_date', new Date().toISOString());

  for (const subscription of renewals || []) {
    try {
      // Process payment with Stripe
      await processSubscriptionRenewal(subscription);
      console.log(`✅ Renewed subscription: ${subscription.id}`);
    } catch (error) {
      console.error(`❌ Failed to renew: ${subscription.id}`, error);
      await handleFailedRenewal(subscription);
    }
  }

  // Clean up expired trials
  await cleanupExpiredTrials();
  
  // Generate monthly reports
  await generateMonthlyReports();
}
```

## Monitoring and Logging

### Task Monitoring
```typescript
interface CronJobLog {
  job_name: string;
  started_at: Date;
  completed_at?: Date;
  status: 'running' | 'completed' | 'failed';
  error_message?: string;
  execution_time_ms?: number;
}

class CronJobMonitor {
  async logJobStart(jobName: string): Promise<string> {
    const logId = crypto.randomUUID();
    
    await supabase
      .from('cron_job_logs')
      .insert({
        id: logId,
        job_name: jobName,
        started_at: new Date().toISOString(),
        status: 'running'
      });
    
    return logId;
  }

  async logJobComplete(logId: string, success: boolean, error?: string): Promise<void> {
    const completedAt = new Date();
    
    await supabase
      .from('cron_job_logs')
      .update({
        completed_at: completedAt.toISOString(),
        status: success ? 'completed' : 'failed',
        error_message: error
      })
      .eq('id', logId);
  }
}
```

### Health Checks
```typescript
async function performHealthCheck() {
  const checks = [
    { name: 'database', check: () => supabase.from('users').select('count').single() },
    { name: 'redis', check: () => redis.ping() },
    { name: 'external_apis', check: () => checkExternalAPIs() }
  ];

  const results = await Promise.allSettled(
    checks.map(async ({ name, check }) => {
      const start = Date.now();
      await check();
      return { name, duration: Date.now() - start, status: 'healthy' };
    })
  );

  // Log results and alert if needed
  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      console.error(`Health check failed: ${checks[index].name}`, result.reason);
      await sendAlert(`Health check failed: ${checks[index].name}`);
    }
  }
}
```

## Error Handling and Alerts

### Error Notification System
```typescript
async function sendAlert(message: string, severity: 'low' | 'medium' | 'high' = 'medium') {
  // Send to monitoring service
  await fetch(process.env.MONITORING_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 VoyageSmart Alert: ${message}`,
      severity,
      timestamp: new Date().toISOString()
    })
  });

  // Log to database
  await supabase
    .from('system_alerts')
    .insert({
      message,
      severity,
      created_at: new Date().toISOString()
    });
}
```

## Deployment and Management

### Environment Configuration
```bash
# .env.local
CRON_SECRET=your-secure-cron-secret
EXCHANGE_API_KEY=your-exchange-rate-api-key
MONITORING_WEBHOOK_URL=your-monitoring-webhook-url
BACKUP_STORAGE_URL=your-backup-storage-url
```

### Manual Task Execution
```typescript
// /api/admin/run-task/route.ts
export async function POST(request: NextRequest) {
  const { task } = await request.json();
  
  // Verify admin authentication
  const user = await verifyAdminAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    switch (task) {
      case 'daily-cleanup':
        await performDailyCleanup();
        break;
      case 'send-reminders':
        await sendTripReminders();
        break;
      case 'update-rates':
        await updateExchangeRates();
        break;
      default:
        throw new Error(`Unknown task: ${task}`);
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

For additional information on cron job setup and management, refer to the deployment documentation or contact the development team.
