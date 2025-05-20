import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import SendDownloadRequestToVonage from './work/send_download_request_to_vonage';
import DownloadProcessedCSV from './work/download_processed_csv';
import ProcessUploadedDataFromUser from './work/process_uploaded_data_from_user';
import CancelCron from './work/cancel_cron';
import ListCrons from './work/list_crons';
import CustomerSecret from './interface/customer_secret';
import StoreCustomerCredentials from './work/store_customer_credentials';
import { Config } from './config';
import VonageTellsUsReportIsReady from './work/vonage_tells_us_report_is_ready';
import RunThisEveryMinute from './work/run_this_every_minute';
import { callCronCheckAgain } from './work/utils';
const app = express();
app.use(express.json());
const port = process.env.VCR_PORT || 3000;

/**
 * Memory DB - All customer secrets preloaded
 */
const CUSTOMER_SECRETS: Array<CustomerSecret> = [];

/**
 * Ensure uploads directory exists
 */
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Serve static files from the "public" folder
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath);
}
app.use(express.static(publicPath));


/**
 * Ensure downloads directory exists
 */
const downloadsDir = path.resolve(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

/**
 * Multer configuration: 30 MB CSV file
 */
const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024, // 1GB in bytes
    },
});

/**
 * REPORTS ENDPOINTS
 */

app.post('/reports', async (req: Request, res: Response) => {
    console.log('USER IS ASKING FOR A REPORT');
    await SendDownloadRequestToVonage(CUSTOMER_SECRETS, req, res);
})

app.post('/reports/callback/:token', async (req: Request, res: Response) => {
    console.log('VONAGE SAYS REPORT IS READY');
    await VonageTellsUsReportIsReady(req, res);
})

app.get('/reports/:token', async (req: Request, res: Response) => {
    console.log('USER CLICKS THE LINK FROM THE RECEIVED EMAIL');
    await DownloadProcessedCSV(req, res);
})

app.post('/reports/upload', upload.single('file'), async (req: Request, res: Response) => {
    console.log('USER WANTS TO PROCESS A CSV FILE');
    ProcessUploadedDataFromUser(req, res);
})

/**
 * CRON ENDPOINTS
 */

app.get('/cron-runner', async (req: Request, res: Response) => {
    //  We run this every minute
    await RunThisEveryMinute(CUSTOMER_SECRETS);
    // We call ourselves again in a minute
    callCronCheckAgain()
    //  Return
    res.json({ success: true, message: 'Checked and triggered eligible cron jobs' });
})

app.get('/crons/list', (req: Request, res: Response) => {
    ListCrons(req, res);
})

app.post('/crons/cancel', (req: Request, res: Response) => {
    CancelCron(req, res);
});

app.post('/customers/credentials', (req: Request, res: Response) => {
    StoreCustomerCredentials(CUSTOMER_SECRETS, req, res);
});

/**
 * PUBLIC GET ENDPOINTS
 */

app.get('/csv/:filename', (req: Request, res: Response) => {
    const DOWNLOAD_FOLDER = path.resolve(__dirname, 'downloads');
    const filename = req.params.filename;

    // Security: prevent path traversal attacks
    if (filename.includes('/') || filename.includes('..')) {
        res.status(400).send('Invalid filename');
        return;
    }

    const filePath = path.join(DOWNLOAD_FOLDER, filename);

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.status(404).send('File not found');
            return;
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.sendFile(filePath);
    });
})



/**
 * Check system health 
 */
app.get('/_/health', async (req: Request, res: Response) => {
    res.sendStatus(200);
});

/**
 * VCR calls this to show metrics related stuff
 */
app.get('/_/metrics', async (req: Request, res: Response) => {
    res.sendStatus(200);
});

/**
 * Listen
 */
app.listen(port, () => {
    console.log(`Server running on PORT ${port}`);
    console.log('This url: ' + Config.SERVER_URL)
    callCronCheckAgain();
});
