type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    if (typeof window !== 'undefined') {
      try {
        const user = localStorage.getItem('supabase.auth.token');
        if (user) {
          const parsed = JSON.parse(user);
          return parsed?.user?.id;
        }
      } catch {
        // Ignore errors
      }
    }
    return undefined;
  }

  private getSessionId(): string | undefined {
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('session-id') || undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private logToConsole(entry: LogEntry): void {
    const { level, message, timestamp, context } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'debug':
        console.debug(prefix, message, context);
        break;
      case 'info':
        console.info(prefix, message, context);
        break;
      case 'warn':
        console.warn(prefix, message, context);
        break;
      case 'error':
        console.error(prefix, message, context);
        break;
    }
  }

  private async logToExternalService(entry: LogEntry): Promise<void> {
    // In production, send logs to external service (e.g., Sentry, LogRocket, etc.)
    if (!this.isProduction) return;

    try {
      // TODO: Implement external logging service integration
      // Example: Send to Sentry, LogRocket, or custom logging endpoint
      
      // For now, we'll just store critical errors locally
      if (entry.level === 'error') {
        const errors = this.getStoredErrors();
        errors.push(entry);
        
        // Keep only last 50 errors
        if (errors.length > 50) {
          errors.splice(0, errors.length - 50);
        }
        
        localStorage.setItem('app-errors', JSON.stringify(errors));
      }
    } catch (error) {
      console.error('Failed to log to external service:', error);
    }
  }

  private getStoredErrors(): LogEntry[] {
    try {
      const stored = localStorage.getItem('app-errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.isDevelopment) return;
    
    const entry = this.formatMessage('debug', message, context);
    this.logToConsole(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.formatMessage('info', message, context);
    this.logToConsole(entry);
    this.logToExternalService(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.formatMessage('warn', message, context);
    this.logToConsole(entry);
    this.logToExternalService(entry);
  }

  error(message: string, context?: Record<string, any>): void {
    const entry = this.formatMessage('error', message, context);
    this.logToConsole(entry);
    this.logToExternalService(entry);
  }

  // Security-specific logging
  security(message: string, context?: Record<string, any>): void {
    const securityEntry = this.formatMessage('error', `[SECURITY] ${message}`, {
      ...context,
      security: true,
    });
    
    this.logToConsole(securityEntry);
    this.logToExternalService(securityEntry);
    
    // In production, immediately alert security team
    if (this.isProduction) {
      // TODO: Implement security alerting
      console.error('SECURITY ALERT:', securityEntry);
    }
  }

  // Performance logging
  performance(operation: string, duration: number, context?: Record<string, any>): void {
    const perfEntry = this.formatMessage('info', `[PERFORMANCE] ${operation} took ${duration}ms`, {
      ...context,
      performance: true,
      duration,
      operation,
    });
    
    // Only log slow operations in production
    if (this.isProduction && duration > 1000) {
      this.logToConsole(perfEntry);
      this.logToExternalService(perfEntry);
    } else if (this.isDevelopment) {
      this.logToConsole(perfEntry);
    }
  }

  // API request logging
  apiRequest(method: string, url: string, status: number, duration: number, context?: Record<string, any>): void {
    const level: LogLevel = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    const entry = this.formatMessage(level, `[API] ${method} ${url} - ${status} (${duration}ms)`, {
      ...context,
      api: true,
      method,
      url,
      status,
      duration,
    });
    
    this.logToConsole(entry);
    
    // Log errors and slow requests to external service
    if (level === 'error' || duration > 2000) {
      this.logToExternalService(entry);
    }
  }

  // User action logging
  userAction(action: string, context?: Record<string, any>): void {
    const entry = this.formatMessage('info', `[USER] ${action}`, {
      ...context,
      userAction: true,
      action,
    });
    
    if (this.isDevelopment) {
      this.logToConsole(entry);
    }
    
    // In production, log important user actions
    if (this.isProduction && this.isImportantAction(action)) {
      this.logToExternalService(entry);
    }
  }

  private isImportantAction(action: string): boolean {
    const importantActions = [
      'login',
      'logout',
      'signup',
      'password_reset',
      'subscription_change',
      'payment',
      'trip_create',
      'trip_delete',
    ];
    
    return importantActions.some(important => action.toLowerCase().includes(important));
  }

  // Get stored errors for debugging
  getStoredErrors(): LogEntry[] {
    return this.getStoredErrors();
  }

  // Clear stored errors
  clearStoredErrors(): void {
    localStorage.removeItem('app-errors');
  }
}

// Create singleton instance
export const logger = new Logger();

// Performance measurement utility
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>,
  context?: Record<string, any>
): T | Promise<T> {
  const start = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result
        .then((value) => {
          const duration = performance.now() - start;
          logger.performance(operation, duration, context);
          return value;
        })
        .catch((error) => {
          const duration = performance.now() - start;
          logger.performance(`${operation} (failed)`, duration, { ...context, error: error.message });
          throw error;
        });
    } else {
      const duration = performance.now() - start;
      logger.performance(operation, duration, context);
      return result;
    }
  } catch (error) {
    const duration = performance.now() - start;
    logger.performance(`${operation} (failed)`, duration, { ...context, error: (error as Error).message });
    throw error;
  }
}

// API request wrapper with logging
export async function loggedApiRequest<T>(
  method: string,
  url: string,
  requestFn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await requestFn();
    const duration = performance.now() - start;
    logger.apiRequest(method, url, 200, duration, context);
    return result;
  } catch (error: any) {
    const duration = performance.now() - start;
    const status = error.status || error.code || 500;
    logger.apiRequest(method, url, status, duration, { ...context, error: error.message });
    throw error;
  }
}
