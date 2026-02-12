
import {
    createEmailScanWorker,
    createUnsubscribeWorker,
    createBulkDeleteWorker,
    createRollupWorker
} from './workers';
import { logger } from '@/lib/logger';

logger.info('🚀 Starting Prunebox Workers...');

try {
    const scanWorker = createEmailScanWorker();
    const unsubWorker = createUnsubscribeWorker();
    const bulkWorker = createBulkDeleteWorker();
    const rollupWorker = createRollupWorker();

    logger.info('✅ All workers initialized and listening for jobs');

    // Handle graceful shutdown
    const shutdown = async () => {
        logger.info('Shutting down workers...');
        await Promise.all([
            scanWorker.close(),
            unsubWorker.close(),
            bulkWorker.close(),
            rollupWorker.close(),
        ]);
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
} catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
}
