# Cron Job Setup

This document provides information about scheduled tasks and automation in VoyageSmart, including cron job configuration, automated processes, and maintenance tasks.

## 📋 Table of Contents
- [Overview](#overview)
- [Current Automated Tasks](#current-automated-tasks)
- [Planned Cron Jobs](#planned-cron-jobs)
- [Implementation Approaches](#implementation-approaches)
- [Configuration](#configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)

## 🎯 Overview

VoyageSmart uses automated tasks to handle routine maintenance, data cleanup, subscription management, and user notifications. These tasks are essential for maintaining system health and providing a smooth user experience.

### Key Benefits
- **Automated Maintenance**: Regular cleanup and optimization tasks
- **Subscription Management**: Handle subscription renewals and expirations
- **User Notifications**: Send timely reminders and updates
- **Data Integrity**: Ensure data consistency and cleanup
- **Performance Optimization**: Regular performance maintenance

## ⚡ Current Automated Tasks

### Subscription Management
Currently handled by Stripe webhooks in real-time:
- **Subscription Renewals**: Automatic processing via Stripe
- **Payment Failures**: Handled through Stripe's dunning management
- **Subscription Cancellations**: Real-time processing via webhooks

### File Cleanup
Manual process that could be automated:
- **Temporary File Cleanup**: Remove temporary uploads
- **Orphaned File Detection**: Find files not linked to any records
- **Storage Optimization**: Compress or archive old files

## 🔄 Planned Cron Jobs

### Daily Tasks

#### 1. Subscription Status Sync
**Schedule**: Daily at 2:00 AM UTC
**Purpose**: Sync local subscription data with Stripe
```typescript
// Pseudo-code for subscription sync
async function syncSubscriptions() {
  const users = await getUsersWithActiveSubscriptions();
  for (const user of users) {
    const stripeSubscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    await updateLocalSubscriptionStatus(user.id, stripeSubscription);
  }
}
```

#### 2. Promotional Code Cleanup
**Schedule**: Daily at 3:00 AM UTC
**Purpose**: Remove expired promotional codes and clean up redemption data
```typescript
async function cleanupPromoCodes() {
  // Remove expired promotional codes
  await deleteExpiredPromoCodes();
  
  // Clean up expired redemptions
  await cleanupExpiredRedemptions();
  
  // Update usage statistics
  await updatePromoCodeStats();
}
```

#### 3. Trip Reminder Notifications
**Schedule**: Daily at 8:00 AM UTC
**Purpose**: Send reminders for upcoming trips
```typescript
async function sendTripReminders() {
  const upcomingTrips = await getTripsStartingInDays(7); // 7 days ahead
  for (const trip of upcomingTrips) {
    await sendTripReminderEmail(trip);
  }
}
```

### Weekly Tasks

#### 1. Database Maintenance
**Schedule**: Weekly on Sunday at 1:00 AM UTC
**Purpose**: Optimize database performance
```sql
-- Database maintenance tasks
VACUUM ANALYZE;
REINDEX DATABASE voyage_smart;
UPDATE pg_stat_statements_reset();
```

#### 2. Storage Cleanup
**Schedule**: Weekly on Sunday at 2:00 AM UTC
**Purpose**: Clean up unused files and optimize storage
```typescript
async function storageCleanup() {
  // Find orphaned files
  const orphanedFiles = await findOrphanedFiles();
  
  // Delete files older than 30 days with no references
  await deleteOrphanedFiles(orphanedFiles);
  
  // Compress old trip media
  await compressOldMedia();
}
```

#### 3. Analytics Data Processing
**Schedule**: Weekly on Monday at 3:00 AM UTC
**Purpose**: Process and aggregate analytics data
```typescript
async function processAnalytics() {
  // Calculate weekly user engagement metrics
  await calculateWeeklyEngagement();
  
  // Update subscription conversion rates
  await updateConversionMetrics();
  
  // Generate usage reports
  await generateUsageReports();
}
```

### Monthly Tasks

#### 1. Subscription Analytics
**Schedule**: Monthly on the 1st at 4:00 AM UTC
**Purpose**: Generate monthly subscription reports
```typescript
async function monthlySubscriptionReport() {
  const report = await generateSubscriptionReport();
  await sendReportToAdmins(report);
  await archiveOldReports();
}
```

#### 2. User Engagement Analysis
**Schedule**: Monthly on the 1st at 5:00 AM UTC
**Purpose**: Analyze user engagement and identify inactive users
```typescript
async function analyzeUserEngagement() {
  const inactiveUsers = await findInactiveUsers(90); // 90 days
  await sendReEngagementEmails(inactiveUsers);
  await updateEngagementMetrics();
}
```

## 🛠️ Implementation Approaches

### Option 1: Vercel Cron Jobs
**Pros**: Native integration, easy setup, automatic scaling
**Cons**: Limited to Vercel platform, potential cold starts

```typescript
// vercel.json configuration
{
  "crons": [
    {
      "path": "/api/cron/daily-maintenance",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/weekly-cleanup",
      "schedule": "0 1 * * 0"
    }
  ]
}
```

### Option 2: External Cron Service
**Pros**: More reliable, better monitoring, platform independent
**Cons**: Additional service dependency, potential security concerns

```bash
# Example crontab configuration
0 2 * * * curl -X POST https://voyage-smart.vercel.app/api/cron/daily-maintenance
0 1 * * 0 curl -X POST https://voyage-smart.vercel.app/api/cron/weekly-cleanup
```

### Option 3: GitHub Actions
**Pros**: Free for public repos, good integration, version controlled
**Cons**: Limited execution time, not ideal for frequent tasks

```yaml
# .github/workflows/cron-jobs.yml
name: Scheduled Tasks
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
jobs:
  daily-maintenance:
    runs-on: ubuntu-latest
    steps:
      - name: Run Daily Maintenance
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/daily-maintenance \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## ⚙️ Configuration

### Environment Variables
```bash
# Cron job configuration
CRON_SECRET=your_secure_cron_secret_here
ENABLE_CRON_JOBS=true
CRON_TIMEZONE=UTC

# Email configuration for notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring configuration
SENTRY_DSN=your_sentry_dsn_here
WEBHOOK_URL=your_monitoring_webhook_url
```

### API Route Structure
```typescript
// /api/cron/[task]/route.ts
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    // Execute cron task
    await executeCronTask();
    return new Response('Success', { status: 200 });
  } catch (error) {
    console.error('Cron job failed:', error);
    return new Response('Error', { status: 500 });
  }
}
```

## 📊 Monitoring and Logging

### Logging Strategy
```typescript
interface CronJobLog {
  jobName: string;
  startTime: Date;
  endTime: Date;
  status: 'success' | 'error' | 'warning';
  message: string;
  recordsProcessed?: number;
  errorDetails?: string;
}

async function logCronJob(log: CronJobLog) {
  await insertCronJobLog(log);
  
  if (log.status === 'error') {
    await sendAlertToAdmins(log);
  }
}
```

### Health Checks
```typescript
// Health check endpoint for cron jobs
export async function GET() {
  const lastRuns = await getLastCronJobRuns();
  const healthStatus = {
    status: 'healthy',
    lastRuns,
    issues: []
  };
  
  // Check if any critical jobs haven't run recently
  for (const job of criticalJobs) {
    const lastRun = lastRuns[job.name];
    if (!lastRun || isOverdue(lastRun, job.frequency)) {
      healthStatus.status = 'unhealthy';
      healthStatus.issues.push(`${job.name} is overdue`);
    }
  }
  
  return Response.json(healthStatus);
}
```

### Monitoring Dashboard
- **Job Status**: Real-time status of all cron jobs
- **Execution History**: Historical data on job performance
- **Error Tracking**: Detailed error logs and alerts
- **Performance Metrics**: Execution time and resource usage

## ❌ Error Handling

### Retry Logic
```typescript
async function executeWithRetry(task: () => Promise<void>, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await task();
      return;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

### Failure Notifications
```typescript
async function handleCronJobFailure(jobName: string, error: Error) {
  // Log the error
  await logCronJobError(jobName, error);
  
  // Send alert to administrators
  await sendAdminAlert({
    subject: `Cron Job Failure: ${jobName}`,
    message: `Job ${jobName} failed with error: ${error.message}`,
    severity: 'high'
  });
  
  // Update monitoring dashboard
  await updateJobStatus(jobName, 'failed');
}
```

## 🔒 Security Considerations

### Authentication
- **Secret-based Authentication**: Use secure tokens for cron job endpoints
- **IP Whitelisting**: Restrict access to known IP addresses
- **Rate Limiting**: Prevent abuse of cron endpoints

### Data Protection
- **Minimal Permissions**: Cron jobs run with minimal required permissions
- **Audit Logging**: All cron job activities are logged
- **Secure Communication**: Use HTTPS for all cron job communications

### Secrets Management
```typescript
// Secure secret verification
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  return authHeader === expectedAuth && 
         process.env.CRON_SECRET && 
         process.env.CRON_SECRET.length >= 32;
}
```

## 🚀 Future Enhancements

### Advanced Scheduling
- **Dynamic Scheduling**: Adjust schedules based on usage patterns
- **Conditional Execution**: Run jobs based on specific conditions
- **Parallel Processing**: Execute independent tasks in parallel

### Enhanced Monitoring
- **Real-time Alerts**: Instant notifications for job failures
- **Performance Analytics**: Detailed performance tracking
- **Predictive Monitoring**: Predict and prevent job failures

### Automation Improvements
- **Self-healing**: Automatic recovery from common failures
- **Load Balancing**: Distribute cron jobs across multiple instances
- **Resource Optimization**: Optimize resource usage for cron jobs

---

The cron job system is designed to be reliable, secure, and maintainable, ensuring that VoyageSmart operates smoothly with minimal manual intervention while providing comprehensive monitoring and error handling capabilities.
