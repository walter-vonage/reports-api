import { Request, Response } from 'express';
import { scheduledJobs } from '../constants/cron_scheduled_jobs';
import { stopScheduledJobById } from './create_cron_from_json';

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
    
    const { cronId } = req.body;

    if (!cronId) {
        res.status(400).json({ message: 'Missing required field: cronId' });
        return;
    }

    if (stopScheduledJobById(cronId)) {
        res.json({ message: 'Cron job cancelled successfully', cronId });
    } else {
        res.json({ message: 'Error trying to cancel Cron job', cronId });
    }

}