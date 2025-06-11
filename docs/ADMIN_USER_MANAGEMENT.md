# Admin User Management

## Overview

The Admin User Management system provides comprehensive tools for administrators to manage user accounts, roles, and subscriptions within VoyageSmart. This feature is only accessible to users with admin privileges.

## Features

### 1. User Overview Dashboard
- **Total Users**: Display total number of registered users
- **Premium Users**: Count of users with Premium subscriptions
- **AI Users**: Count of users with AI Assistant subscriptions
- **Admins**: Count of users with admin role

### 2. User Listing & Search
- **Paginated Table**: Display users in a responsive table with pagination
- **Search Functionality**: Search users by email or full name
- **Advanced Filters**:
  - Subscription Tier (Free, Premium, AI Assistant)
  - Status (Active, Inactive, Canceled)
  - Role (User, Admin)

### 3. Individual User Management
- **View User Details**: Complete user profile information
- **Edit User Role**: Change between User and Admin roles
- **Manage Subscription**: Update tier, status, and validity period
- **Delete User**: Permanently remove user and all associated data

### 4. Bulk Operations
- **Bulk Role Update**: Change role for multiple users simultaneously
- **Bulk Subscription Update**: Update subscription details for multiple users
- **Reset to Free Plan**: Reset multiple users to Free subscription
- **Bulk Delete**: Delete multiple users at once

## Access Control

### Admin Authentication
- Only users with `role: "admin"` in their preferences can access admin features
- Protected by `AdminProtected` component
- Admin token verification for API endpoints

### Navigation
- Admin menu accessible from user profile dropdown
- Quick access links in Admin Dashboard
- Mobile-friendly admin navigation

## API Endpoints

### GET `/api/admin/users`
Retrieve paginated list of users with filtering options.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term for email/name
- `tier`: Filter by subscription tier
- `status`: Filter by subscription status
- `role`: Filter by user role

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "User Name",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z",
      "last_login": "2024-01-01T00:00:00Z",
      "subscription": {
        "tier": "premium",
        "status": "active",
        "valid_until": "2024-12-31T23:59:59Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### PATCH `/api/admin/users/[id]`
Update user role and subscription details.

**Request Body:**
```json
{
  "role": "admin",
  "subscription": {
    "tier": "ai",
    "status": "active",
    "valid_until": "2024-12-31T23:59:59Z"
  }
}
```

### DELETE `/api/admin/users/[id]`
Permanently delete a user and all associated data.

### POST `/api/admin/users/bulk`
Perform bulk operations on multiple users.

**Request Body:**
```json
{
  "action": "updateRole",
  "userIds": ["uuid1", "uuid2"],
  "data": {
    "role": "admin"
  }
}
```

**Available Actions:**
- `updateRole`: Change user role
- `updateSubscription`: Update subscription details
- `resetSubscription`: Reset to Free plan
- `delete`: Delete users

## UI Components

### Main Components
- **UserManagement** (`/admin/users`): Main page component
- **EditUserModal**: Modal for editing individual users
- **BulkActionsModal**: Modal for bulk operations
- **DeleteUserModal**: Confirmation modal for user deletion

### Features
- **Responsive Design**: Works on desktop and mobile
- **Real-time Search**: Debounced search with instant results
- **Batch Selection**: Select multiple users with checkboxes
- **Status Badges**: Visual indicators for roles and subscription status
- **Confirmation Dialogs**: Safety prompts for destructive actions

## Security Considerations

### Data Protection
- All admin operations require admin token verification
- User deletion includes cascade deletion of all related data
- Subscription history is maintained for audit purposes

### Audit Trail
- All admin actions are logged in subscription_history table
- Bulk operations include detailed tracking
- Admin user identification in audit logs

## Database Schema

### Users Table
- `id`: UUID primary key
- `email`: User email address
- `full_name`: User's full name
- `preferences`: JSONB containing role information
- `created_at`: Account creation timestamp
- `last_login`: Last login timestamp

### User Subscriptions Table
- `user_id`: Reference to users table
- `tier`: Subscription tier (free, premium, ai)
- `status`: Subscription status (active, inactive, canceled)
- `valid_until`: Subscription expiry date

### Subscription History Table
- Tracks all subscription changes
- Includes admin actions and bulk operations
- Maintains audit trail for compliance

## Usage Examples

### Searching Users
1. Navigate to `/admin/users`
2. Use search bar to find users by email or name
3. Apply filters for tier, status, or role
4. Results update automatically

### Editing a User
1. Click the action menu (⋯) next to a user
2. Select "Edit User"
3. Modify role and/or subscription details
4. Save changes

### Bulk Operations
1. Select multiple users using checkboxes
2. Click "Bulk Actions" button
3. Choose desired action
4. Configure action parameters
5. Confirm and execute

### User Deletion
1. Click action menu next to user
2. Select "Delete User"
3. Review warning about data deletion
4. Confirm deletion

## Error Handling

### API Errors
- Invalid admin token: 401 Unauthorized
- Missing parameters: 400 Bad Request
- Database errors: 500 Internal Server Error

### UI Error Handling
- Toast notifications for success/error states
- Loading states during operations
- Graceful fallbacks for failed requests

## Performance Considerations

### Pagination
- Default 20 users per page
- Configurable page size
- Efficient database queries with LIMIT/OFFSET

### Search Optimization
- Debounced search input (500ms delay)
- Database indexes on email and full_name
- Efficient filtering with database-level operations

### Bulk Operations
- Batch processing for large user sets
- Progress tracking for long-running operations
- Error reporting for failed operations

## Future Enhancements

### Planned Features
- Export user data to CSV/Excel
- Advanced user analytics and reporting
- User activity monitoring
- Automated user lifecycle management
- Integration with external user management systems

### Performance Improvements
- Virtual scrolling for large user lists
- Background processing for bulk operations
- Caching for frequently accessed data
- Real-time updates with WebSocket connections
