import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import CsvRow from './interface/csv_row';
import ReadCSV from './work/read_csv';
import { filterDataRows } from './work/filter_data';
import FilterConfig from './interface/filter_config';
import { runReportJob } from './work/report.worker';
import ReportJob from './interface/rport_job';
import { downloadTestReport } from './work/download_report';
import { getReportByName } from './work/get_filter';
import { createCronExpressionFromJson } from './work/create_cron_from_json';
import { scheduledJobs } from './constants/cron_scheduled_jobs';
const app = express();
app.use(express.json());
const port = process.env.VCR_PORT || 3000;

/**
 * Ensure uploads directory exists
 */
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

/**
 * Multer configuration: 30 MB CSV file
 */
const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: 30 * 1024 * 1024, // 10MB in bytes
    },
});

/**
 * Check system health 
 */
app.get('/_/health', async (req, res) => {
    res.sendStatus(200);
});

/**
 * VCR calls this to show metrics related stuff
 */
app.get('/_/metrics', async (req, res) => {
    res.sendStatus(200);
});

// Upload Report and process
app.post('/reports/upload', upload.single('file'), async (req: Request, res: Response) => {

    const file = req.file;                                              //  This is the CSV file. What's the biggest size?
    const reportName = req.body.reportName;                             //  Let's offer some predefined reports? They could send custom as well...
    const startDate = req.body.startDate;                               //  Start date for the report
    const endDate = req.body.endDate;                                   //  End date for the report
    const emailTo = req.body.emailTo;                                   //  If sent, we report to an Email
    const includeRows = (req.body.includeRows === '1');                 //  Optional if we incliude in the response JSON all the records from the CSV or not
    const includeMessages = (req.body.includeMessages === '1');         //  Optional if we include in the response JSON the messages once grouped or not
    const data = req.body.data ? JSON.parse( req.body.data ) : null;    //  This field brings parameters to use in the "reportName"

    /**
     * Validate
     */
    if (!file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }
    if (!reportName || !startDate || !endDate) {
        res.status(400).json({ message: 'Must define: reportName, startDate, endDate' });
        return;
    }

    try {
        const reportJob: ReportJob | null = getReportByName(reportName, emailTo, startDate, endDate, data);
        if (!reportJob) {
            res.status(400).json({ message: 'Invalid report name: ' + reportName });
            return;
        }
        const filterToUse = reportJob.filterConfig;
        console.log('filterToUse', filterToUse)

        //  1) Download from Vonage Reports API
        // const file = await downloadReport(reportJob.startDate, reportJob.endDate, 'SMS');
        const file = await downloadTestReport();

        //  2) Read the CSV content
        const content: CsvRow[] = await ReadCSV(file);

        //  3) Filter for what's mentioned in the variable "filterToUse"
        const filteredRows = filterDataRows(content, filterToUse);

        //  4) Group the report based on the content of "reportJob"
        const reportResult: { success: boolean; groupResults: any[] } = await runReportJob(reportJob, filteredRows, includeMessages);

        //  5) Check if the user wants to start a Cron Job
        const cronJson = req.body.cron ? JSON.parse(req.body.cron) : null;
        if (cronJson) {
            createCronExpressionFromJson(reportJob, filterToUse, cronJson, includeMessages);
        }

        //  5) Respond
        res.json({
            success: true,
            count: filteredRows.length,
            ...(includeRows && { rows: filteredRows }), // <- conditionally include "rows" which is the content of the CSV in the response
            reportResult
        })

    } catch (err) {
        res.status(500).json({ message: 'Error processing file', error: err });
    }
})

/**
 * List all the Cron Jobs added
 */
app.get('/crons/list', (req: Request, res: Response) => {
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
})

/**
 * This endpoint will cancel a given Cron Jon
 * Example: {
    "startDate": "2025-04-01",
    "endDate": "2025-04-07",
    "emailTo": "reporting@decathlon.com",
    "cronExpr": "0 8 * * 1,2,3,4,5"
    }
 */
app.post('/crons/cancel', (req: Request, res: Response) => {
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
});



app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
