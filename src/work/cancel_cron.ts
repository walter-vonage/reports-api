import { Request, Response } from 'express';
import { scheduledJobs } from '../constants/cron_scheduled_jobs';

/**
 * This endpoint will cancel a given Cron Jon
 * Example: {
    "startDate": "2025-04-01",
    "endDate": "2025-04-07",
    "emailTo": "reporting@decathlon.com",
    "cronExpr": "0 8 * * 1,2,3,4,5"
    }
 */
export default async function CancelCron(req: Request, res: Response) {
    
    const { startDate, endDate, email, cron } = req.body;

    if (!startDate || !endDate || !cron) {
        res.status(400).json({ message: 'Missing required fields: startDate, endDate, email, cron' });
        return;
    }

    const key = `${cron}|${startDate}|${endDate}|${email || 'no-email'}`;

    const task = scheduledJobs.get(key);
    if (!task) {
        res.status(404).json({ message: 'No cron job found with the given parameters' });
        return;
    }

    task.stop();
    scheduledJobs.delete(key);

    res.json({ message: 'Cron job cancelled successfully', key });
}