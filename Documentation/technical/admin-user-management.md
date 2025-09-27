# Admin User Management

This document outlines the administrative user management system in VoyageSmart, including role-based access control, user administration, and security features.

## Overview

VoyageSmart implements a comprehensive admin system that allows for user management, role assignment, system monitoring, and administrative oversight of the platform.

## Admin Roles and Permissions

### Role Hierarchy

**Super Admin**
- Full system access
- User management (create, modify, delete)
- System configuration
- Database access
- Security settings
- Billing and subscription management

**Admin**
- User management (limited)
- Content moderation
- Support ticket management
- Analytics and reporting
- Feature flag management

**Moderator**
- Content review and moderation
- User support
- Basic reporting
- Limited user actions (suspend/warn)

**Support Agent**
- Customer support access
- User account assistance
- Ticket management
- Read-only analytics

### Permission Matrix

| Feature | Super Admin | Admin | Moderator | Support |
|---------|-------------|-------|-----------|---------|
| User CRUD | ✅ | ✅ | ❌ | ❌ |
| Role Assignment | ✅ | ✅ | ❌ | ❌ |
| System Config | ✅ | ❌ | ❌ | ❌ |
| Database Access | ✅ | ❌ | ❌ | ❌ |
| Content Moderation | ✅ | ✅ | ✅ | ❌ |
| Support Tickets | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ (Read-only) |
| Billing Management | ✅ | ❌ | ❌ | ❌ |

## User Management Features

### User Administration

**User Search and Filtering**
- Search by email, name, or ID
- Filter by registration date
- Filter by subscription status
- Filter by activity level
- Filter by role or permissions

**User Profile Management**
- View complete user profiles
- Edit user information
- Reset passwords
- Manage email verification
- Update subscription status

**Account Actions**
- Suspend user accounts
- Activate/deactivate accounts
- Delete user accounts (with data retention policies)
- Merge duplicate accounts
- Transfer account ownership

### Bulk Operations

**Bulk User Actions**
- Mass email communications
- Bulk role assignments
- Batch account suspensions
- Group subscription updates
- Data export operations

**Import/Export**
- CSV user data export
- Bulk user import
- Account migration tools
- Data backup operations

## Role-Based Access Control (RBAC)

### Implementation

**Database Schema**
```sql
-- Users table with role assignment
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  role VARCHAR DEFAULT 'user',
  permissions JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Roles table
roles (
  id UUID PRIMARY KEY,
  name VARCHAR UNIQUE,
  description TEXT,
  permissions JSONB,
  created_at TIMESTAMP
);

-- User role assignments
user_roles (
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);
```

**Permission System**
- Granular permission control
- Resource-based permissions
- Action-based permissions
- Hierarchical permission inheritance

### Security Implementation

**Access Control Middleware**
```typescript
// Role-based middleware
export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Permission-based middleware
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user || !hasPermission(user, permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    next();
  };
};
```

## Admin Dashboard

### Dashboard Components

**User Statistics**
- Total registered users
- Active users (daily/monthly)
- New registrations
- Subscription conversions
- User retention metrics

**System Health**
- Server performance metrics
- Database performance
- API response times
- Error rates and logs
- Security alerts

**Content Moderation**
- Flagged content queue
- User reports
- Automated moderation alerts
- Content approval workflow

### Analytics and Reporting

**User Analytics**
- User growth trends
- Engagement metrics
- Feature usage statistics
- Geographic distribution
- Device and platform analytics

**Business Metrics**
- Subscription revenue
- Conversion rates
- Churn analysis
- Customer lifetime value
- Support ticket metrics

## Security Features

### Admin Security

**Multi-Factor Authentication**
- Required for all admin accounts
- TOTP (Time-based One-Time Password)
- SMS backup codes
- Hardware key support

**Session Management**
- Secure session handling
- Session timeout policies
- Concurrent session limits
- Activity logging

**IP Restrictions**
- Whitelist admin IP addresses
- Geographic restrictions
- VPN detection and blocking
- Suspicious activity alerts

### Audit Logging

**Admin Action Logging**
```typescript
interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values?: any;
  new_values?: any;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
}
```

**Logged Actions**
- User account modifications
- Role and permission changes
- System configuration updates
- Data access and exports
- Security-related actions

## API Endpoints

### User Management APIs

**Get Users**
```http
GET /api/admin/users
Authorization: Bearer <admin-token>

Query Parameters:
- page: number
- limit: number
- search: string
- role: string
- status: string
```

**Update User**
```http
PUT /api/admin/users/{userId}
Authorization: Bearer <admin-token>

Body:
{
  "email": "user@example.com",
  "role": "admin",
  "status": "active",
  "permissions": ["read", "write"]
}
```

**Bulk Actions**
```http
POST /api/admin/users/bulk
Authorization: Bearer <admin-token>

Body:
{
  "action": "suspend",
  "user_ids": ["user1", "user2", "user3"],
  "reason": "Policy violation"
}
```

### Role Management APIs

**Create Role**
```http
POST /api/admin/roles
Authorization: Bearer <admin-token>

Body:
{
  "name": "content_moderator",
  "description": "Content moderation role",
  "permissions": ["moderate_content", "view_reports"]
}
```

**Assign Role**
```http
POST /api/admin/users/{userId}/roles
Authorization: Bearer <admin-token>

Body:
{
  "role_id": "role_123"
}
```

## Implementation Guidelines

### Database Considerations

**Row Level Security (RLS)**
```sql
-- Enable RLS on admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy for admin access
CREATE POLICY admin_access ON admin_users
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
```

**Indexes for Performance**
```sql
-- Indexes for user management queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
```

### Frontend Implementation

**Admin Route Protection**
```typescript
// Admin route wrapper
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

**Permission-Based UI**
```typescript
// Permission hook
export const usePermission = (permission: string) => {
  const { user } = useAuth();
  return user?.permissions?.includes(permission) || false;
};

// Usage in components
const CanDeleteUser = ({ children }: { children: React.ReactNode }) => {
  const canDelete = usePermission('delete_user');
  return canDelete ? <>{children}</> : null;
};
```

## Security Best Practices

### Admin Account Security

1. **Strong Authentication**
   - Enforce strong passwords
   - Require MFA for all admin accounts
   - Regular password rotation
   - Account lockout policies

2. **Access Control**
   - Principle of least privilege
   - Regular permission audits
   - Time-limited admin sessions
   - IP-based restrictions

3. **Monitoring and Alerting**
   - Real-time security monitoring
   - Suspicious activity alerts
   - Failed login attempt tracking
   - Privilege escalation detection

### Data Protection

1. **Sensitive Data Handling**
   - Encrypt sensitive user data
   - Secure data transmission
   - Data retention policies
   - GDPR compliance measures

2. **Backup and Recovery**
   - Regular data backups
   - Disaster recovery procedures
   - Data integrity verification
   - Secure backup storage

## Monitoring and Maintenance

### System Monitoring

**Health Checks**
- Database connectivity
- API endpoint availability
- Authentication service status
- Third-party integrations

**Performance Monitoring**
- Response time tracking
- Resource utilization
- Error rate monitoring
- User experience metrics

### Maintenance Tasks

**Regular Maintenance**
- User account cleanup
- Audit log rotation
- Performance optimization
- Security updates

**Scheduled Tasks**
- Daily user activity reports
- Weekly security scans
- Monthly permission audits
- Quarterly access reviews

## Troubleshooting

### Common Issues

**Permission Denied Errors**
- Verify user role assignments
- Check permission configurations
- Review middleware implementation
- Validate JWT tokens

**Performance Issues**
- Optimize database queries
- Review index usage
- Monitor resource consumption
- Implement caching strategies

### Support Procedures

**Escalation Process**
1. Level 1: Support agents
2. Level 2: System administrators
3. Level 3: Development team
4. Level 4: Security team

**Emergency Procedures**
- Account compromise response
- System breach protocols
- Data loss recovery
- Service outage management

For additional information on admin user management, consult the security documentation or contact the development team.
