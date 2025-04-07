import cron, { ScheduledTask } from 'node-cron';

/**
 * Let's keep track of the Cron jobs created so we don't create the same twice
 * for the same file, time and days of the week
 */
export const scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
