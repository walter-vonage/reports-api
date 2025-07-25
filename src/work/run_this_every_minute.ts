import { Request, Response } from 'express';
import CustomerSecret from '../interface/customer_secret';
import { scheduledJobs } from '../constants/cron_scheduled_jobs';
import { calculateDateRangeFromSchedule, parseCronSchedule } from './utils';
import initiateDownloadReport from './download_report';

export default async function RunThisEveryMinute(
    CUSTOMER_SECRETS: Array<CustomerSecret>
) {
    // console.log(`[${new Date().toISOString()}] Checking scheduled tasks...`);

    for (const [jobId, scheduledTask] of scheduledJobs.entries()) {
        const { meta: cron, req, res } = scheduledTask;

        const now = new Date();
        const currentDay = now.getUTCDay();       // 0-6
        const currentHour = now.getUTCHours();    // 0-23
        const currentMinute = now.getUTCMinutes(); // 0-59

        console.log('currentDay', currentDay)
        console.log('currentHour', currentHour)
        console.log('currentMinute', currentMinute)

        const { hour, minute, days } = parseCronSchedule(cron);
        if (!days.includes(currentDay) || currentHour !== hour || currentMinute !== minute) {
            console.log('Nothing scheduled for hour: ' + currentHour + ' Minute: ' + currentMinute + ' Day: ' + currentDay)
            continue;
        }

        try {
            console.log(`Triggering scheduled task [${cron.jobName || jobId}]`);

            const customerName = req.body.token || null;
            let apiKey = req.body.apiKey || null;
            let apiSecret = req.body.apiSecret || null;
            let accountId = req.body.accountId || null;

            if (!apiKey || !apiSecret || !accountId) {
                const customerData = CUSTOMER_SECRETS.find(c => c.id === customerName);
                if (customerData) {
                    apiKey = customerData.apiKey;
                    apiSecret = customerData.apiSecret;
                    accountId = customerData.accountId;
                } else {
                    console.warn(`Missing credentials for ${customerName}`);
                    continue;
                }
            }

            const { startDate, endDate } = calculateDateRangeFromSchedule(cron);

            await initiateDownloadReport(
                req,
                res,
                CUSTOMER_SECRETS,
                apiKey,
                apiSecret,
                accountId,
                startDate,
                endDate,
                req.body.product || 'SMS',
                req.body.include_subaccounts,
                req.body.include_messages,
                req.body.direction || 'outbound',
                req.body.emailTo,
                req.body.reportJob,
                false
            );

        } catch (error) {
            console.error(`Error running job ${jobId}:`, error);
        }
    }
}