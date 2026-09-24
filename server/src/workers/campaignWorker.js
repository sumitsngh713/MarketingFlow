import cron from 'node-cron';
import { processCampaignQueues } from '../services/queueService.js';

let isRunning = false;

export function startBackgroundWorker() {
  console.log('[WORKER] Initializing background campaign & follow-up scheduler...');

  // Run queue processor every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const summary = await processCampaignQueues();
      if (summary.emailsDispatched > 0 || summary.whatsAppDispatched > 0 || summary.leadsHalted > 0) {
        console.log('[WORKER] Queue cycle complete:', summary);
      }
    } catch (err) {
      console.error('[WORKER] Error executing queue cycle:', err.message);
    } finally {
      isRunning = false;
    }
  });

  // Daily midnight task: reset daily sent counter for SMTP accounts
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[WORKER] Midnight reset: resetting daily email and WhatsApp account counters.');
      const prisma = (await import('../utils/db.js')).default;
      await prisma.emailAccount.updateMany({ data: { sentToday: 0 } });
    } catch (err) {
      console.error('[WORKER] Midnight reset error:', err.message);
    }
  });

  console.log('[WORKER] Background scheduler active (Queue interval: 2 minutes).');
}

// Standalone execution support
if (process.argv[1]?.endsWith('campaignWorker.js')) {
  startBackgroundWorker();
}
