import { Request, Response } from 'express';
import { CronSchedule } from "../interface/cron_schedule";
import { scheduledJobs } from "../constants/cron_scheduled_jobs";
import CustomerSecret from '../interface/customer_secret';
import ReportRequestModel from '../interface/report_request';
import initiateDownloadReport from './download_report';
const nodeCron = require('node-cron');

/**
 * This function will create a Cron job and run the process as defined
 */
export function createCronExpressionFromJson(CUSTOMER_SECRETS: Array<CustomerSecret>, REPORT_REQUESTS: Array<ReportRequestModel>, req: Request, res: Response): boolean {
    
    const customerName = req.body.customerName || null;
    let   apiKey = req.body.apiKey || null;
    let   apiSecret = req.body.apiSecret || null;                               
    let   accountId = req.body.accountId || null;
    const startDate = req.body.startDate;                               
    const endDate = req.body.endDate;                                   
    const product = req.body.product || 'SMS';                          
    const direction = req.body.direction || 'outbound';                 
    const include_subaccounts = req.body.include_subaccounts;           
    const include_messages = req.body.include_messages;           
    const emailTo = req.body.emailTo;                                   
    const includeRows = req.body.includeRows;
    const includeMessages = req.body.includeMessages;
    const cron = req.body.cron;
    const reportJob = req.body.reportJob;

    if (!apiKey || !apiSecret || !accountId) {
        const customerData = CUSTOMER_SECRETS.find((i:CustomerSecret) => i.name == customerName);
        if (customerData && customerData.apiKey && customerData.apiSecret && customerData.accountId) {
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

    const cronExpr = getCronExpressionFromJson(cron);

    // Create a unique key for this job
    const key = `${cronExpr}|${startDate}|${endDate}|${emailTo || 'no-email'}`;

    // If key exists, skip it
    if (scheduledJobs.has(key)) {
        console.log(`Cron already scheduled for: ${key}`);
        return false;
    }

    console.log(`Scheduling report job with cron: ${cronExpr}`);

    const task = nodeCron.schedule(cronExpr, async () => {
        try {
            if ((apiKey && apiSecret && accountId) || customerName) {

                const response = await initiateDownloadReport(
                    req,
                    res,
                    CUSTOMER_SECRETS, 
                    REPORT_REQUESTS,
                    apiKey, 
                    apiSecret, 
                    accountId, 
                    startDate, 
                    endDate, 
                    product, 
                    include_subaccounts, 
                    include_messages,
                    direction,
                    emailTo,
                    includeRows,
                    includeMessages,
                    reportJob,
                    false,
                );
            
                REPORT_REQUESTS.push( response )
                
                console.log(`CRON - Report generated and processed at ${new Date().toISOString()}`);        
            }
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