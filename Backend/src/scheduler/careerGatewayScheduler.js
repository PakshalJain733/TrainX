import { executeDailyTrainingSync } from '../modules/integrations/careerGateway/services/dailyTrainingSync.worker.js';

let intervalId = null;
let lastRunDate = null;
let isSyncRunning = false;

/**
 * Returns current timestamp parts in Asia/Kolkata timezone.
 */
export function getKolkataTimeInfo(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value])
  );

  const dateStr = `${parts.year}-${parts.month}-${parts.day}`;
  const hour = parseInt(parts.hour, 10);
  const minute = parseInt(parts.minute, 10);
  const second = parseInt(parts.second, 10);

  return { dateStr, hour, minute, second };
}

/**
 * SYNC-01: Drift-proof, window-tolerant daily synchronization runner.
 * Evaluates whether today's 02:00 IST run is due and executes safely with locking.
 * Does not rely on fragile exact-minute string equality ('02:00').
 */
export async function checkAndRunDailySync() {
  if (isSyncRunning) return null;

  const { dateStr, hour } = getKolkataTimeInfo();

  // Trigger when it is 02:00 AM IST or later, and today's export has not yet run
  if (hour >= 2 && lastRunDate !== dateStr) {
    isSyncRunning = true;
    try {
      lastRunDate = dateStr;
      console.log(`🚀 [Scheduler] Triggering Daily Training Export for ${dateStr} (02:00+ IST window)...`);
      const result = await executeDailyTrainingSync({
        triggeredBy: 'scheduled_daily_cron_0200_ist',
      });
      console.log(`✅ [Scheduler] Daily Training Export completed: ${result?.status} (Total: ${result?.total || 0})`);
      return result;
    } catch (err) {
      console.error('❌ [Scheduler Error] Daily training export job failed:', err.message);
      // Reset lastRunDate so subsequent tick can retry if transient failure occurred
      lastRunDate = null;
      throw err;
    } finally {
      isSyncRunning = false;
    }
  }

  return null;
}

/**
 * Initializes the daily training synchronization scheduler.
 * Uses a 30-second watchdog loop with drift tolerance and catch-up recovery.
 */
export function initCareerGatewayScheduler() {
  if (process.env.DISABLE_CAREER_GATEWAY_SCHEDULER === 'true') {
    console.log('[Scheduler] Career Gateway daily export scheduler is disabled via environment variable.');
    return;
  }

  console.log('⏰ [Scheduler] Career Gateway Daily Training Export Scheduler initialized (Target: 02:00 AM Asia/Kolkata, Drift-Proof).');

  // Check immediately upon startup in case service restarted after 02:00 AM IST
  checkAndRunDailySync().catch((err) => {
    console.warn('[Scheduler Startup Check Warning]', err.message);
  });

  // Watchdog ticker every 30 seconds
  intervalId = setInterval(async () => {
    try {
      await checkAndRunDailySync();
    } catch (err) {
      // Logged inside checkAndRunDailySync
    }
  }, 30000);
}

export function stopCareerGatewayScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function getLastRunDate() {
  return lastRunDate;
}

export function setLastRunDate(dateStr) {
  lastRunDate = dateStr;
}
