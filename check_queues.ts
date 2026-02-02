
import 'dotenv/config';
import { getQueues } from './src/modules/queues/client';

async function main() {
    const { emailScanQueue, unsubscribeQueue, rollupQueue, bulkDeleteQueue } = getQueues();

    const [scanJobs, unsubJobs, rollupJobs, deleteJobs] = await Promise.all([
        emailScanQueue.getJobCounts(),
        unsubscribeQueue.getJobCounts(),
        rollupQueue.getJobCounts(),
        bulkDeleteQueue.getJobCounts(),
    ]);

    console.log('Scan Jobs:', scanJobs);
    console.log('Unsub Jobs:', unsubJobs);
    console.log('Rollup Jobs:', rollupJobs);
    console.log('Delete Jobs:', deleteJobs);
}

main().catch(console.error).finally(() => process.exit(0));
