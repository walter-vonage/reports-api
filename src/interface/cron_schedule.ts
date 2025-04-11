
/**
 * If you want to run the previous 24 hours, when the cron runs, then do this:
 * ...
 * "getDataFromPrevious": 24,
 * "unit": "hours"
 * ...
 * 
 * If you want to get the previous 7 days because this cron runs once a week:
 * ...
 * "getDataFromPrevious": 7,
 * "unit": "days"
 * ...
 */
export interface CronSchedule {
    id: string;
    jobName: string;
    startAt: string; // format: "HH:mm"
    getDataFromPrevious: number;
    unit: 'hours' | 'days';
    mon?: boolean;
    tue?: boolean;
    wed?: boolean;
    thu?: boolean;
    fri?: boolean;
    sat?: boolean;
    sun?: boolean;
}