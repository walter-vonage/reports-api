import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ReportRequestModel from './interface/report_request';
import SendDownloadRequestToVonage from './work/send_download_request_to_vonage';
import CheckPeriodicallyForDownloadedReports from './work/check_periodically_for_downloaded_reports';
import DownloadProcessedCSV from './work/download_processed_csv';
import ProcessUploadedDataFromUser from './work/process_uploaded_data_from_user';
import CancelCron from './work/cancel_cron';
import ListCrons from './work/list_crons';
import CustomerSecret from './interface/customer_secret';
import StoreCustomerCredentials from './work/store_customer_credentials';
import { Config } from './config';
const app = express();
app.use(express.json());
const port = process.env.VCR_PORT || 3000;

/**
 * Memory DB - All reports requested
 */
const REPORT_REQUESTS: Array<ReportRequestModel> = []

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

app.post('/reports', async (req: Request, res: Response) => {
    await SendDownloadRequestToVonage(CUSTOMER_SECRETS, REPORT_REQUESTS, req, res);
})

app.get('/reports/:token', async (req: Request, res: Response) => {
    await DownloadProcessedCSV(req, res);
})

app.post('/reports/upload', upload.single('file'), async (req: Request, res: Response) => {    
    ProcessUploadedDataFromUser(req, res);    
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

CheckPeriodicallyForDownloadedReports(REPORT_REQUESTS);


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
});
