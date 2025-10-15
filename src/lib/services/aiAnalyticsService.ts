import { logger } from '@/lib/logger';

interface AIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorsByType: Record<string, number>;
  requestsByHour: Record<string, number>;
  queueStats: {
    averageWaitTime: number;
    maxQueueLength: number;
    totalQueuedRequests: number;
  };
}

interface AIRequestLog {
  id: string;
  timestamp: number;
  tripId: string;
  messageLength: number;
  responseLength?: number;
  duration: number;
  success: boolean;
  error?: string;
  errorType?: string;
  cacheHit: boolean;
  queueWaitTime?: number;
  meta?: Record<string, any>;
}

class AIAnalyticsService {
  private metrics: AIMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    errorsByType: {},
    requestsByHour: {},
    queueStats: {
      averageWaitTime: 0,
      maxQueueLength: 0,
      totalQueuedRequests: 0
    }
  };

  private requestLogs: AIRequestLog[] = [];
  private maxLogSize = 1000; // Keep last 1000 requests

  /**
   * Log an AI request
   */
  logRequest(log: Omit<AIRequestLog, 'id' | 'timestamp'>): void {
    const requestLog: AIRequestLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      ...log
    };

    // Add to logs
    this.requestLogs.push(requestLog);
    
    // Keep only recent logs
    if (this.requestLogs.length > this.maxLogSize) {
      this.requestLogs = this.requestLogs.slice(-this.maxLogSize);
    }

    // Update metrics
    this.updateMetrics(requestLog);

    // Log to console for debugging
    logger.debug('AI request logged', {
      id: requestLog.id,
      success: requestLog.success,
      duration: requestLog.duration,
      cacheHit: requestLog.cacheHit,
      errorType: requestLog.errorType
    });
  }

  /**
   * Update metrics based on request log
   */
  private updateMetrics(log: AIRequestLog): void {
    this.metrics.totalRequests++;

    if (log.success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      
      // Track error types
      if (log.errorType) {
        this.metrics.errorsByType[log.errorType] = (this.metrics.errorsByType[log.errorType] || 0) + 1;
      }
    }

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + log.duration;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;

    // Update cache hit rate
    const cacheHits = this.requestLogs.filter(l => l.cacheHit).length;
    this.metrics.cacheHitRate = (cacheHits / this.requestLogs.length) * 100;

    // Update requests by hour
    const hour = new Date(log.timestamp).getHours().toString();
    this.metrics.requestsByHour[hour] = (this.metrics.requestsByHour[hour] || 0) + 1;

    // Update queue stats if available
    if (log.queueWaitTime !== undefined) {
      this.metrics.queueStats.totalQueuedRequests++;
      const totalWaitTime = this.metrics.queueStats.averageWaitTime * (this.metrics.queueStats.totalQueuedRequests - 1) + log.queueWaitTime;
      this.metrics.queueStats.averageWaitTime = totalWaitTime / this.metrics.queueStats.totalQueuedRequests;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent request logs
   */
  getRecentLogs(limit: number = 50): AIRequestLog[] {
    return this.requestLogs.slice(-limit);
  }

  /**
   * Get error analysis
   */
  getErrorAnalysis(): {
    errorRate: number;
    topErrors: Array<{ type: string; count: number; percentage: number }>;
    recentErrors: AIRequestLog[];
  } {
    const errorRate = (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
    
    const topErrors = Object.entries(this.metrics.errorsByType)
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / this.metrics.failedRequests) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentErrors = this.requestLogs
      .filter(log => !log.success)
      .slice(-10);

    return {
      errorRate,
      topErrors,
      recentErrors
    };
  }

  /**
   * Get performance analysis
   */
  getPerformanceAnalysis(): {
    averageResponseTime: number;
    p95ResponseTime: number;
    slowestRequests: AIRequestLog[];
    cacheEffectiveness: {
      hitRate: number;
      averageTimeWithCache: number;
      averageTimeWithoutCache: number;
    };
  } {
    const sortedByDuration = [...this.requestLogs].sort((a, b) => a.duration - b.duration);
    const p95Index = Math.floor(sortedByDuration.length * 0.95);
    const p95ResponseTime = sortedByDuration[p95Index]?.duration || 0;

    const slowestRequests = [...this.requestLogs]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    const cachedRequests = this.requestLogs.filter(log => log.cacheHit);
    const nonCachedRequests = this.requestLogs.filter(log => !log.cacheHit);

    const averageTimeWithCache = cachedRequests.length > 0 
      ? cachedRequests.reduce((sum, log) => sum + log.duration, 0) / cachedRequests.length 
      : 0;

    const averageTimeWithoutCache = nonCachedRequests.length > 0 
      ? nonCachedRequests.reduce((sum, log) => sum + log.duration, 0) / nonCachedRequests.length 
      : 0;

    return {
      averageResponseTime: this.metrics.averageResponseTime,
      p95ResponseTime,
      slowestRequests,
      cacheEffectiveness: {
        hitRate: this.metrics.cacheHitRate,
        averageTimeWithCache,
        averageTimeWithoutCache
      }
    };
  }

  /**
   * Get usage patterns
   */
  getUsagePatterns(): {
    requestsByHour: Record<string, number>;
    peakHours: string[];
    averageMessageLength: number;
    averageResponseLength: number;
  } {
    const peakHours = Object.entries(this.metrics.requestsByHour)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour);

    const averageMessageLength = this.requestLogs.length > 0
      ? this.requestLogs.reduce((sum, log) => sum + log.messageLength, 0) / this.requestLogs.length
      : 0;

    const responseLogs = this.requestLogs.filter(log => log.responseLength);
    const averageResponseLength = responseLogs.length > 0
      ? responseLogs.reduce((sum, log) => sum + (log.responseLength || 0), 0) / responseLogs.length
      : 0;

    return {
      requestsByHour: this.metrics.requestsByHour,
      peakHours,
      averageMessageLength,
      averageResponseLength
    };
  }

  /**
   * Reset metrics (for testing or periodic reset)
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorsByType: {},
      requestsByHour: {},
      queueStats: {
        averageWaitTime: 0,
        maxQueueLength: 0,
        totalQueuedRequests: 0
      }
    };
    this.requestLogs = [];
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    metrics: AIMetrics;
    logs: AIRequestLog[];
    analysis: {
      errors: ReturnType<typeof this.getErrorAnalysis>;
      performance: ReturnType<typeof this.getPerformanceAnalysis>;
      usage: ReturnType<typeof this.getUsagePatterns>;
    };
  } {
    return {
      metrics: this.getMetrics(),
      logs: this.getRecentLogs(100),
      analysis: {
        errors: this.getErrorAnalysis(),
        performance: this.getPerformanceAnalysis(),
        usage: this.getUsagePatterns()
      }
    };
  }
}

// Singleton instance
const aiAnalytics = new AIAnalyticsService();

export { aiAnalytics, type AIRequestLog, type AIMetrics };
