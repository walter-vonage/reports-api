import { Request, Response } from 'express';
import { CronSchedule } from "../interface/cron_schedule";
import { scheduledJobs } from "../constants/cron_scheduled_jobs";
import CustomerSecret from '../interface/customer_secret';
import { generateUnique6DigitNumber, parseCronSchedule } from './utils';

/**
 * This function will create a Cron job and run the process as defined
 */
export function createCronExpressionFromJson(
    CUSTOMER_SECRETS: Array<CustomerSecret>,
    req: Request,
    res: Response
): boolean {

    const customerName = req.body.token || null;
    let apiKey = req.body.apiKey || null;
    let apiSecret = req.body.apiSecret || null;
    let accountId = req.body.accountId || null;
    const cron = req.body.cron;

    if (!apiKey || !apiSecret || !accountId) {
        const customerData = CUSTOMER_SECRETS.find((i: CustomerSecret) => i.id == customerName);
        if (customerData) {
            apiKey = customerData.apiKey;
            apiSecret = customerData.apiSecret;
            accountId = customerData.accountId;
        } else {
            res.status(200).json({
                success: false,
                message: 'No ApiKey or customer information'
            })
            return false;
        }
    }

    // Create a unique key for this job
    const cronId = cron.id || generateUnique6DigitNumber();

    // If key exists, skip it
    if (scheduledJobs.has(cronId)) {
        console.log(`Cron already scheduled for ID: ${cronId}`);
        return false;
    }

    const { hour, minute, days } = parseCronSchedule(cron);
    if (!days.length) {
        console.warn('No valid days specified for schedule');
        return false;
    }

    console.log(`Scheduling report job [ID: ${cronId}] at ${hour}:${minute} on days [${days.join(',')}]`);

    scheduledJobs.set(cronId, {
        meta: {
            ...cron,
            id: cronId,
        },
        req,
        res
    })

    return true
}

export function stopScheduledJobById(cronId: string): boolean {
    const task = scheduledJobs.get(cronId);
    if (!task) {
        console.warn(`No scheduled task found for ID: ${cronId}`);
        return false;
    }
    scheduledJobs.delete(cronId);
    console.log(`Stopped and removed job ID: ${cronId}`);
    return true;
}


export function listScheduledJobs(): CronSchedule[] {
    return Array.from(scheduledJobs.values()).map(task => task.meta);
}
