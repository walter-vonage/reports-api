import { CronSchedule } from "./cron_schedule";
import { Request, Response } from 'express';

export interface ScheduledTask {
    meta: CronSchedule;
    req: Request,
    res: Response,
}
