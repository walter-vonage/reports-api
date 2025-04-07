import { CronSchedule } from "../interface/cron_schedule";
import cron from 'node-cron';
import CsvRow from "../interface/csv_row";
import ReadCSV from "./read_csv";
import FilterConfig from "../interface/filter_config";
import { filterDataRows } from "./filter_data";
import { runReportJob } from "./report.worker";
import ReportJob from "../interface/rport_job";
import { downloadTestReport } from "./download_report";
import { scheduledJobs } from "../constants/cron_scheduled_jobs";

/**
 * This function will create a Cron job and run the process as defined
 * @param reportJob : The report condition
 * @param filterToUse : The filter to apply to the CSV data
 * @param schedule : How often you want to run this Cron
 * @returns 
 */
export function createCronExpressionFromJson(
    reportJob: ReportJob, 
    filterToUse: FilterConfig, 
    schedule: CronSchedule,
    includeMessages: boolean
): boolean {
    
    const cronExpr = getCronExpressionFromJson(schedule);

    // Create a unique key for this job
    const key = `${cronExpr}|${reportJob.startDate}|${reportJob.endDate}|${reportJob.emailTo || 'no-email'}`;

    // If key exists, skip it
    if (scheduledJobs.has(key)) {
        console.log(`Cron already scheduled for: ${key}`);
        return false;
    }

    console.log(`Scheduling report job with cron: ${cronExpr}`);

    const task = cron.schedule(cronExpr, async () => {
        try {
            //  1) Download a fresh CSV file
            const file = await downloadTestReport();

            //  1) Read and process the CSV
            const content: CsvRow[] = await ReadCSV(file);
            const filteredRows = filterDataRows(content, filterToUse);
            await runReportJob(reportJob, filteredRows, includeMessages);

            console.log(`Report generated and processed at ${new Date().toISOString()}`);
        } catch (e) {
            console.error('Cron job error:', e);
        }
    })

    // Store reference to avoid duplicates
    scheduledJobs.set(key, task);

    return true
}

/**
 * Will get a JSON coming from the user 
 * and convert it to a Nodejs supported Cron format
 * Something like: {
    "startAt": "08:30",
    "mon": true,
    "tue": true,
    "wed": true,
    "thu": true,
    "fri": true,
    "sat": false,
    "sun": false
    }
    And converts to something like: 30 8 * * 1,2,3,4,5
 */
function getCronExpressionFromJson(schedule: CronSchedule): string {
    const [hour, minute] = schedule.startAt.split(':').map(Number);

    const days: Record<'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat', number> = {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
    };

    const activeDays = Object.entries(schedule)
        .filter(([key, val]) => key in days && val)
        .map(([key]) => days[key as keyof typeof days]);

    if (activeDays.length === 0) {
        throw new Error('No days selected for cron schedule');
    }

    return `${minute} ${hour} * * ${activeDays.join(',')}`;
}