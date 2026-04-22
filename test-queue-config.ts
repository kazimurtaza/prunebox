import { Redis } from 'ioredis';
import { Queue } from 'bullmq';

// Test Redis connection directly
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

async function testQueueConfiguration() {
  let redis: Redis | null = null;

  try {
    console.log('Testing Redis connection...');

    // Test basic Redis connection
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    // Wait for connection to establish
    await new Promise((resolve, reject) => {
      redis!.on('connect', resolve);
      redis!.on('error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    console.log('✓ Redis connection successful');

    // Test ping
    const pingResult = await redis.ping();
    console.log('✓ Redis ping successful:', pingResult);

    // Test queue creation with same configuration as in queues.ts
    const defaultJobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600,
        count: 5000,
      },
    };

    const testQueue = new Queue('test-queue', {
      connection: redis,
      defaultJobOptions,
    });

    console.log('✓ Test queue created successfully');

    // Add a simple test job
    const job = await testQueue.add('test-job', { message: 'test' });
    console.log('✓ Test job added successfully:', job.id);

    // Close connections
    await testQueue.close();
    await redis.quit();

    console.log('✓ All tests passed - Job queue configuration is working correctly');

  } catch (error) {
    console.error('✗ Test failed:', error);

    // Clean up on error
    if (redis) {
      try {
        await redis.quit();
      } catch (e) {
        console.log('Error during cleanup:', e);
      }
    }

    process.exit(1);
  }
}

testQueueConfiguration();