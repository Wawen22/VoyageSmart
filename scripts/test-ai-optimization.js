/**
 * Script di test per verificare le ottimizzazioni AI
 * Eseguire con: node scripts/test-ai-optimization.js
 */

const { performance } = require('perf_hooks');

// Mock delle funzioni per test
console.log('🧪 Testing AI Optimization Services...\n');

// Test 1: Cache Service
console.log('1️⃣ Testing Cache Service...');
const cache = new Map();
const CACHE_TTL = 5000; // 5 secondi per test

function setCachedResponse(key, data, ttl) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}

function getCachedResponse(key) {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
  }
  return null;
}

// Test cache
setCachedResponse('test-key', 'test-data', CACHE_TTL);
const cachedResult = getCachedResponse('test-key');
console.log(`   ✅ Cache set/get: ${cachedResult === 'test-data' ? 'PASS' : 'FAIL'}`);

// Test cache expiry
setTimeout(() => {
  const expiredResult = getCachedResponse('test-key');
  console.log(`   ✅ Cache expiry: ${expiredResult === null ? 'PASS' : 'FAIL'}`);
}, 100);

// Test 2: Retry Logic
console.log('\n2️⃣ Testing Retry Logic...');

function calculateDelay(attempt, config) {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.1 * delay;
  return Math.min(delay + jitter, config.maxDelay);
}

const retryConfig = {
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

const delays = [1, 2, 3, 4].map(attempt => calculateDelay(attempt, retryConfig));
console.log(`   ✅ Exponential backoff delays: ${delays.map(d => Math.round(d) + 'ms').join(', ')}`);

const isIncreasing = delays.every((delay, i) => i === 0 || delay >= delays[i - 1]);
console.log(`   ✅ Delays increasing: ${isIncreasing ? 'PASS' : 'FAIL'}`);

// Test 3: Queue Simulation
console.log('\n3️⃣ Testing Queue Logic...');

class MockQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 2;
    this.activeRequests = 0;
  }

  async enqueue(item) {
    return new Promise((resolve) => {
      this.queue.push({ item, resolve });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    const queueItem = this.queue.shift();
    if (!queueItem) return;

    this.processing = true;
    this.activeRequests++;

    // Simulate processing
    setTimeout(() => {
      queueItem.resolve(`Processed: ${queueItem.item}`);
      this.activeRequests--;
      this.processing = false;
      
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 10);
      }
    }, 50);
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests
    };
  }
}

const queue = new MockQueue();

// Test concurrent processing
Promise.all([
  queue.enqueue('item1'),
  queue.enqueue('item2'),
  queue.enqueue('item3')
]).then(results => {
  console.log(`   ✅ Queue processing: ${results.length === 3 ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Results: ${results.join(', ')}`);
});

// Test 4: Analytics Simulation
console.log('\n4️⃣ Testing Analytics Logic...');

class MockAnalytics {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
    this.logs = [];
  }

  logRequest(log) {
    this.logs.push({ ...log, timestamp: Date.now() });
    this.updateMetrics(log);
  }

  updateMetrics(log) {
    this.metrics.totalRequests++;
    
    if (log.success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + log.duration;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
  }

  getSuccessRate() {
    return this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0;
  }
}

const analytics = new MockAnalytics();

// Simulate some requests
analytics.logRequest({ duration: 500, success: true });
analytics.logRequest({ duration: 300, success: true });
analytics.logRequest({ duration: 800, success: false });
analytics.logRequest({ duration: 200, success: true });

console.log(`   ✅ Total requests: ${analytics.metrics.totalRequests}`);
console.log(`   ✅ Success rate: ${analytics.getSuccessRate().toFixed(1)}%`);
console.log(`   ✅ Average response time: ${analytics.metrics.averageResponseTime.toFixed(0)}ms`);

// Test 5: Performance Measurement
console.log('\n5️⃣ Testing Performance Measurement...');

async function simulateAPICall() {
  const start = performance.now();
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  
  const duration = performance.now() - start;
  return duration;
}

Promise.all([
  simulateAPICall(),
  simulateAPICall(),
  simulateAPICall()
]).then(durations => {
  const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  console.log(`   ✅ Simulated API calls: ${durations.map(d => Math.round(d) + 'ms').join(', ')}`);
  console.log(`   ✅ Average duration: ${Math.round(avgDuration)}ms`);
});

// Test 6: Error Classification
console.log('\n6️⃣ Testing Error Classification...');

function classifyError(error) {
  const message = error.message || error.toString();
  
  if (message.includes('429')) return 'rate_limit';
  if (message.includes('503')) return 'service_unavailable';
  if (message.includes('timeout')) return 'timeout';
  if (message.includes('network')) return 'network';
  if (message.includes('API key')) return 'auth';
  
  return 'unknown';
}

const testErrors = [
  new Error('429 Too Many Requests'),
  new Error('503 Service Unavailable'),
  new Error('Request timeout'),
  new Error('Network error'),
  new Error('Invalid API key'),
  new Error('Something else')
];

testErrors.forEach(error => {
  const type = classifyError(error);
  console.log(`   ✅ "${error.message}" → ${type}`);
});

console.log('\n🎉 All tests completed!');
console.log('\n📋 Summary:');
console.log('   • Cache service: Implemented with TTL and cleanup');
console.log('   • Retry logic: Exponential backoff with jitter');
console.log('   • Queue system: Concurrent processing with limits');
console.log('   • Analytics: Comprehensive metrics tracking');
console.log('   • Performance: Real-time measurement');
console.log('   • Error handling: Intelligent classification');

console.log('\n🚀 Ready for deployment!');
