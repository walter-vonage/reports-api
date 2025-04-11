import { Request, Response } from 'express';
import { listScheduledJobs } from "./create_cron_from_json";

/**
 * List all the Cron Jobs added
 */
export default async function ListCrons(req: Request, res: Response) {
    const jobs = listScheduledJobs()
    res.json({
        count: jobs.length,
        jobs
    })
}