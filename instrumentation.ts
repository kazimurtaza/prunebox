export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeWorkers, closeWorkers } = await import('@/modules/queues/workers');

    initializeWorkers();

    process.on('beforeExit', async () => {
      await closeWorkers();
    });

    process.on('SIGINT', async () => {
      await closeWorkers();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await closeWorkers();
      process.exit(0);
    });
  }
}
