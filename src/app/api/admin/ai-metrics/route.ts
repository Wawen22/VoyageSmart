import { NextRequest, NextResponse } from 'next/server';
import { aiAnalytics } from '@/lib/services/aiAnalyticsService';
import { getQueueStats } from '@/lib/services/aiQueueService';
import { logger } from '@/lib/logger';

// Force dynamic rendering - do not pre-render this route during build
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // TODO: Add admin authentication check here
    // For now, we'll just log the request
    logger.debug('AI metrics requested');

    // Get comprehensive analytics
    const metrics = aiAnalytics.getMetrics();
    const errorAnalysis = aiAnalytics.getErrorAnalysis();
    const performanceAnalysis = aiAnalytics.getPerformanceAnalysis();
    const usagePatterns = aiAnalytics.getUsagePatterns();
    const queueStats = getQueueStats();
    const recentLogs = aiAnalytics.getRecentLogs(20);

    // Calculate additional insights
    const insights = {
      healthScore: calculateHealthScore(metrics, errorAnalysis),
      recommendations: generateRecommendations(metrics, errorAnalysis, performanceAnalysis),
      trends: calculateTrends(recentLogs)
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRequests: metrics.totalRequests,
          successRate: metrics.totalRequests > 0 ? (metrics.successfulRequests / metrics.totalRequests) * 100 : 0,
          averageResponseTime: metrics.averageResponseTime,
          cacheHitRate: metrics.cacheHitRate,
          currentQueueLength: queueStats.queueLength,
          activeRequests: queueStats.activeRequests
        },
        metrics,
        errorAnalysis,
        performanceAnalysis,
        usagePatterns,
        queueStats,
        insights,
        recentLogs: recentLogs.map(log => ({
          ...log,
          // Remove sensitive data
          tripId: log.tripId.substring(0, 8) + '...'
        }))
      }
    });

  } catch (error: any) {
    logger.error('Error fetching AI metrics', {
      error: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch AI metrics',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(metrics: any, errorAnalysis: any): number {
  let score = 100;

  // Penalize high error rate
  if (errorAnalysis.errorRate > 10) score -= 30;
  else if (errorAnalysis.errorRate > 5) score -= 15;
  else if (errorAnalysis.errorRate > 2) score -= 5;

  // Penalize slow response times
  if (metrics.averageResponseTime > 10000) score -= 25; // > 10s
  else if (metrics.averageResponseTime > 5000) score -= 15; // > 5s
  else if (metrics.averageResponseTime > 3000) score -= 5; // > 3s

  // Reward good cache hit rate
  if (metrics.cacheHitRate < 20) score -= 10;
  else if (metrics.cacheHitRate > 60) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate recommendations based on metrics
 */
function generateRecommendations(metrics: any, errorAnalysis: any, _performanceAnalysis: any): string[] {
  const recommendations: string[] = [];

  // Error rate recommendations
  if (errorAnalysis.errorRate > 5) {
    recommendations.push('High error rate detected. Consider implementing more robust error handling and retry logic.');
  }

  // Performance recommendations
  if (metrics.averageResponseTime > 5000) {
    recommendations.push('Response times are slow. Consider optimizing prompts or upgrading AI service tier.');
  }

  // Cache recommendations
  if (metrics.cacheHitRate < 30) {
    recommendations.push('Low cache hit rate. Consider increasing cache TTL or improving cache key strategy.');
  }

  // Queue recommendations
  if (metrics.queueStats.averageWaitTime > 2000) {
    recommendations.push('High queue wait times. Consider increasing concurrent request limit.');
  }

  // Rate limiting recommendations
  const rateLimitErrors = errorAnalysis.topErrors.find((e: any) => e.type === 'rate_limit');
  if (rateLimitErrors && rateLimitErrors.count > 5) {
    recommendations.push('Frequent rate limiting. Consider implementing more aggressive request throttling.');
  }

  if (recommendations.length === 0) {
    recommendations.push('System is performing well. Continue monitoring for any changes.');
  }

  return recommendations;
}

/**
 * Calculate trends from recent logs
 */
function calculateTrends(recentLogs: any[]): any {
  if (recentLogs.length < 10) {
    return {
      responseTimeTrend: 'insufficient_data',
      errorRateTrend: 'insufficient_data',
      requestVolumeTrend: 'insufficient_data'
    };
  }

  const half = Math.floor(recentLogs.length / 2);
  const firstHalf = recentLogs.slice(0, half);
  const secondHalf = recentLogs.slice(half);

  // Response time trend
  const firstHalfAvgTime = firstHalf.reduce((sum, log) => sum + log.duration, 0) / firstHalf.length;
  const secondHalfAvgTime = secondHalf.reduce((sum, log) => sum + log.duration, 0) / secondHalf.length;
  const responseTimeTrend = secondHalfAvgTime > firstHalfAvgTime * 1.1 ? 'increasing' : 
                           secondHalfAvgTime < firstHalfAvgTime * 0.9 ? 'decreasing' : 'stable';

  // Error rate trend
  const firstHalfErrors = firstHalf.filter(log => !log.success).length / firstHalf.length;
  const secondHalfErrors = secondHalf.filter(log => !log.success).length / secondHalf.length;
  const errorRateTrend = secondHalfErrors > firstHalfErrors * 1.5 ? 'increasing' :
                        secondHalfErrors < firstHalfErrors * 0.5 ? 'decreasing' : 'stable';

  return {
    responseTimeTrend,
    errorRateTrend,
    requestVolumeTrend: 'stable', // Would need longer time series for this
    firstHalfAvgTime: Math.round(firstHalfAvgTime),
    secondHalfAvgTime: Math.round(secondHalfAvgTime),
    firstHalfErrorRate: Math.round(firstHalfErrors * 100),
    secondHalfErrorRate: Math.round(secondHalfErrors * 100)
  };
}
