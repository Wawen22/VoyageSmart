import { logger } from '@/lib/logger';

interface QueueItem {
  id: string;
  prompt: string;
  options: any;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
  timestamp: number;
  retries: number;
}

class AIRequestQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private maxConcurrent = 2; // Massimo 2 richieste simultanee
  private activeRequests = 0;
  private requestDelay = 1000; // 1 secondo tra le richieste
  private lastRequestTime = 0;

  /**
   * Add request to queue
   */
  async enqueue(prompt: string, options: any = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const item: QueueItem = {
        id: Math.random().toString(36).substring(7),
        prompt,
        options,
        resolve,
        reject,
        timestamp: Date.now(),
        retries: 0
      };

      this.queue.push(item);
      logger.debug('Request added to AI queue', { 
        queueId: item.id, 
        queueLength: this.queue.length,
        promptLength: prompt.length
      });

      this.processQueue();
    });
  }

  /**
   * Process queue items
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    const item = this.queue.shift();
    if (!item) {
      return;
    }

    this.processing = true;
    this.activeRequests++;

    try {
      // Respect rate limiting - wait if needed
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.requestDelay) {
        const waitTime = this.requestDelay - timeSinceLastRequest;
        logger.debug('Waiting before processing AI request', { 
          queueId: item.id, 
          waitTime 
        });
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      this.lastRequestTime = Date.now();

      // Import the AI service here to avoid circular dependencies
      const { callGeminiAPI } = await import('./aiApiService');
      
      logger.debug('Processing AI request from queue', { 
        queueId: item.id,
        queueLength: this.queue.length,
        activeRequests: this.activeRequests
      });

      const result = await callGeminiAPI(item.prompt, item.options);
      item.resolve(result);

      logger.debug('AI request completed successfully', { 
        queueId: item.id,
        responseLength: result.length
      });

    } catch (error: any) {
      logger.error('AI request failed in queue', {
        queueId: item.id,
        error: error.message,
        retries: item.retries
      });

      // Retry logic for specific errors
      if (this.shouldRetry(error, item)) {
        item.retries++;
        this.queue.unshift(item); // Put back at front of queue
        logger.debug('Retrying AI request', { 
          queueId: item.id, 
          retries: item.retries 
        });
      } else {
        item.reject(error);
      }
    } finally {
      this.activeRequests--;
      this.processing = false;

      // Process next item if available
      if (this.queue.length > 0) {
        // Small delay before processing next item
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: any, item: QueueItem): boolean {
    const maxRetries = 2;
    const retryableErrors = ['429', '503', '502', '504', 'ECONNRESET', 'ETIMEDOUT'];
    
    if (item.retries >= maxRetries) {
      return false;
    }

    // Check if error is retryable
    const errorString = error.message || error.toString();
    return retryableErrors.some(code => errorString.includes(code));
  }

  /**
   * Get queue statistics
   */
  getStats(): { queueLength: number; activeRequests: number; processing: boolean } {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      processing: this.processing
    };
  }

  /**
   * Clear queue (for testing or emergency situations)
   */
  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    logger.warn('AI request queue cleared');
  }
}

// Singleton instance
const aiQueue = new AIRequestQueue();

/**
 * Queue an AI request with automatic retry and rate limiting
 */
export async function queueAIRequest(prompt: string, options: any = {}): Promise<string> {
  return aiQueue.enqueue(prompt, options);
}

/**
 * Get queue statistics
 */
export function getQueueStats() {
  return aiQueue.getStats();
}

/**
 * Clear the queue (for testing or emergency situations)
 */
export function clearQueue(): void {
  aiQueue.clear();
}
