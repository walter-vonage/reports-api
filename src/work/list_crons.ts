import { Request, Response } from 'express';
import { scheduledJobs } from '../constants/cron_scheduled_jobs';

/**
 * List all the Cron Jobs added
 */
export default async function ListCrons(req: Request, res: Response) {
    const jobs = Array.from(scheduledJobs.keys()).map(key => {
        const [expr, startDate, endDate, email] = key.split('|');
        return {
            cron: expr,
            startDate,
            endDate,
            email
        };
    });
    res.json({
        total: jobs.length,
        jobs
    });
}