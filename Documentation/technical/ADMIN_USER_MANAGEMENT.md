# Admin User Management

This document provides comprehensive information about the admin features and user management system in VoyageSmart.

## 📋 Table of Contents
- [Overview](#overview)
- [Admin Role System](#admin-role-system)
- [Admin Dashboard](#admin-dashboard)
- [User Management](#user-management)
- [Promotional Code Management](#promotional-code-management)
- [System Monitoring](#system-monitoring)
- [Security Features](#security-features)
- [API Endpoints](#api-endpoints)

## 🎯 Overview

VoyageSmart includes a comprehensive admin system that allows administrators to manage users, monitor system health, manage promotional codes, and access advanced analytics. The admin system is role-based and provides secure access to administrative functions.

### Key Features
- **Role-based access control** with admin privileges
- **User management** with full CRUD operations
- **Subscription management** for all users
- **Promotional code system** with creation and tracking
- **System monitoring** and analytics
- **Webhook testing** and debugging tools

## 👑 Admin Role System

### Role Definition
Admin users are identified by having `role: "admin"` in their user preferences:
```json
{
  "preferences": {
    "role": "admin",
    "subscription_plan": "ai_assistant",
    "subscription_status": "active"
  }
}
```

### Admin Privileges
- Access to admin dashboard and all admin features
- User management capabilities (view, edit, delete users)
- Subscription management for all users
- Promotional code creation and management
- System monitoring and analytics access
- Webhook testing and debugging tools

### Admin Navigation
Admin users see additional navigation options:
- **Admin** menu item in the top navigation
- Access to `/admin/*` routes
- Special admin-only components and features

## 🏠 Admin Dashboard

### Dashboard Overview
The admin dashboard provides a centralized view of:
- **User Statistics**: Total users, active subscriptions, growth metrics
- **Subscription Analytics**: Plan distribution, revenue metrics
- **System Health**: Performance metrics, error rates
- **Recent Activity**: Latest user registrations, subscriptions, issues

### Current Admin Sections
- **Promo Manager** (`/admin/promo-manager`): Promotional code management
- **User Management** (planned): Complete user management interface
- **Analytics** (planned): Advanced system analytics
- **System Settings** (planned): Global system configuration

## 👥 User Management

### User Overview
Admins can view and manage all users in the system:
- **User List**: Paginated list of all users with search and filtering
- **User Details**: Complete user profile and activity information
- **Subscription Status**: Current plan, payment status, usage metrics
- **Activity History**: Login history, feature usage, support tickets

### User Operations
- **View User Profile**: Complete user information and preferences
- **Edit User Details**: Modify user information and settings
- **Manage Subscriptions**: Change plans, handle billing issues
- **Reset Passwords**: Force password resets for users
- **Suspend/Activate**: Temporarily disable user accounts
- **Delete Users**: Permanent user account removal (with data retention policies)

### Bulk Operations
- **Export User Data**: CSV/Excel export of user information
- **Bulk Email**: Send notifications to user groups
- **Bulk Subscription Changes**: Apply subscription changes to multiple users
- **Data Migration**: Handle user data migrations and updates

## 🎁 Promotional Code Management

### Current Implementation
The promo manager (`/admin/promo-manager`) provides:
- **Create Promotional Codes**: Generate new promo codes with custom parameters
- **View Active Codes**: List all active promotional codes
- **Usage Tracking**: Monitor redemption rates and usage statistics
- **Code Management**: Edit, disable, or delete promotional codes

### Promotional Code Features
- **Custom Code Generation**: Create codes with specific names or auto-generate
- **Plan Assignment**: Assign codes to specific subscription plans
- **Duration Control**: Set duration in months for promotional access
- **Usage Limits**: Control maximum number of redemptions per code
- **Expiration Dates**: Set expiration dates for promotional codes

### Code Analytics
- **Redemption Tracking**: Monitor which codes are being used
- **User Attribution**: Track which users redeemed which codes
- **Conversion Metrics**: Measure promo code effectiveness
- **Revenue Impact**: Calculate revenue impact of promotional campaigns

## 📊 System Monitoring

### Performance Metrics
- **Response Times**: API endpoint performance monitoring
- **Error Rates**: Track application errors and failures
- **User Activity**: Monitor user engagement and feature usage
- **Database Performance**: Query performance and optimization opportunities

### Subscription Analytics
- **Plan Distribution**: Breakdown of users by subscription plan
- **Conversion Rates**: Free to paid conversion tracking
- **Churn Analysis**: Subscription cancellation patterns
- **Revenue Metrics**: Monthly recurring revenue (MRR) and growth

### Usage Statistics
- **Feature Adoption**: Track usage of different features
- **AI Usage**: Monitor AI assistant and wizard usage
- **Storage Usage**: Track file uploads and storage consumption
- **API Usage**: Monitor API endpoint usage patterns

## 🔒 Security Features

### Access Control
- **Role-based Authentication**: Only admin users can access admin features
- **Route Protection**: Admin routes protected by middleware
- **API Security**: Admin API endpoints require admin role verification
- **Audit Logging**: All admin actions are logged for security

### Data Protection
- **Sensitive Data Handling**: Proper handling of user personal information
- **GDPR Compliance**: Tools for data export and deletion requests
- **Encryption**: Sensitive admin data encrypted at rest
- **Secure Communication**: All admin operations use HTTPS

### Admin Activity Logging
- **Action Tracking**: Log all admin actions with timestamps
- **User Impact**: Track which users are affected by admin actions
- **Change History**: Maintain history of administrative changes
- **Security Alerts**: Alert on suspicious admin activity

## 🔄 API Endpoints

### User Management APIs
- `GET /api/admin/users` - List all users with pagination and filtering
- `GET /api/admin/users/[id]` - Get detailed user information
- `PUT /api/admin/users/[id]` - Update user information
- `DELETE /api/admin/users/[id]` - Delete user account
- `POST /api/admin/users/[id]/reset-password` - Force password reset

### Subscription Management APIs
- `GET /api/admin/subscriptions` - List all subscriptions
- `PUT /api/admin/subscriptions/[id]` - Update subscription
- `POST /api/admin/subscriptions/[id]/cancel` - Cancel subscription
- `POST /api/admin/subscriptions/[id]/refund` - Process refund

### Promotional Code APIs
- `GET /api/admin/promo-codes` - List all promotional codes
- `POST /api/admin/promo-codes` - Create new promotional code
- `PUT /api/admin/promo-codes/[id]` - Update promotional code
- `DELETE /api/admin/promo-codes/[id]` - Delete promotional code

### Analytics APIs
- `GET /api/admin/analytics/users` - User analytics data
- `GET /api/admin/analytics/subscriptions` - Subscription analytics
- `GET /api/admin/analytics/usage` - Feature usage analytics
- `GET /api/admin/analytics/revenue` - Revenue analytics

### System APIs
- `GET /api/admin/system/health` - System health check
- `GET /api/admin/system/logs` - System logs and errors
- `POST /api/admin/system/webhook-test` - Test webhook functionality

## 🚀 Future Enhancements

### Planned Features
- **Complete User Management Interface**: Full CRUD operations for users
- **Advanced Analytics Dashboard**: Comprehensive system analytics
- **Automated Alerts**: System health and security alerts
- **Bulk Operations**: Mass user and subscription management
- **Custom Reports**: Generate custom analytics reports

### Advanced Admin Features
- **A/B Testing Management**: Control feature flags and experiments
- **Content Management**: Manage app content and messaging
- **Integration Management**: Manage third-party integrations
- **Backup and Recovery**: Database backup and restore tools

### Security Enhancements
- **Two-Factor Authentication**: Require 2FA for admin accounts
- **IP Whitelisting**: Restrict admin access to specific IP addresses
- **Session Management**: Advanced session control for admin users
- **Compliance Tools**: Enhanced GDPR and privacy compliance features

## 🔧 Implementation Guidelines

### Admin Component Development
```typescript
// Example admin component with role checking
const AdminComponent = () => {
  const { user } = useAuth();
  
  if (!user?.preferences?.role === 'admin') {
    return <AccessDenied />;
  }
  
  return <AdminInterface />;
};
```

### API Route Protection
```typescript
// Example admin API route protection
export async function GET(request: Request) {
  const user = await getCurrentUser();
  
  if (user?.preferences?.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Admin logic here
}
```

### Database Queries
```sql
-- Example admin query with proper filtering
SELECT * FROM users 
WHERE created_at >= $1 
AND subscription_plan = $2
ORDER BY created_at DESC
LIMIT 50 OFFSET $3;
```

---

The admin system is designed to be secure, scalable, and user-friendly, providing administrators with the tools they need to effectively manage the VoyageSmart platform while maintaining security and compliance standards.
