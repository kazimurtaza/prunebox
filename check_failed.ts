
import 'dotenv/config';
import { getQueues } from './src/modules/queues/client';

async function main() {
    const { bulkDeleteQueue } = getQueues();
    const failed = await bulkDeleteQueue.getFailed();
    for (const job of failed) {
        console.log(`Job ${job.id} failed: ${job.failedReason}`);
        console.log('Data:', job.data);
    }
}

main().catch(console.error).finally(() => process.exit(0));
