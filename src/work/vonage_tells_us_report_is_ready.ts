import axios from 'axios';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { runReportJob } from './report.worker';
import ReadCSV from './read_csv';
import { sendReportEmail } from './emailService';
import CsvRow from '../interface/csv_row';
import ReportJob from '../interface/rport_job';
import { Config } from '../config';
import generateHtmlReport from './generate_report';
import AdmZip from 'adm-zip';
import { filterDataRows } from './filter_data';
import { generateEmailBody } from './generate_email_body';
import { Request, Response } from 'express';

/**
 * Check if there is any report pending to process
 */
export default async function VonageTellsUsReportIsReady(
    req: Request, 
    res: Response,
) {    
    const { request_id, _links } = req.body;

    if (!_links?.download_report?.href) {
        console.log('Missing download link');
        return res.status(400).json({ message: 'Missing download link' });
    }

    const token = req.params.token as string;
    if (!token) {
        console.log('Missing token in callback');
        return res.status(400).json({ message: 'Missing token in callback' });
    }
        
    // Decode request context from token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123') as {
        VONAGE_USERNAME: string,
        VONAGE_PASSWORD: string,
        emailTo?: string;
        includeRows: boolean;
        includeMessages: boolean;
        reportJob: ReportJob;
    };

    if (!decoded.reportJob) {
        console.warn(`Skipping report ${request_id} — missing reportJob in token`);
    }

    try {
        const authString = `Basic ${Buffer.from(`${decoded.VONAGE_USERNAME}:${decoded.VONAGE_PASSWORD}`).toString('base64')}`;
        const downloadUrl = _links.download_report.href;
        const DOWNLOAD_FOLDER = path.resolve(__dirname, '../downloads');
        const filename = `report_${Date.now()}.csv`;
        const filePath = path.join(DOWNLOAD_FOLDER, filename);

        // Download CSV file
        const responseCSV = await axios.get(downloadUrl, { 
            responseType: 'stream',
            headers: {
                'Authorization': authString, // <-- required if the download URL is protected
            }
        });
        const writer = fs.createWriteStream(filePath);
        responseCSV.data.pipe(writer);

        await new Promise<void>((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Unzip the file
        const zip = new AdmZip(filePath);
        const zipEntries = zip.getEntries();
        if (zipEntries.length === 0) {
            throw new Error('ZIP file is empty');
        }

        // Assume the first CSV inside is the one we want
        const extractedCsvFile = zipEntries.find(entry => entry.entryName.endsWith('.csv'));
        if (!extractedCsvFile) {
            throw new Error('No CSV file found inside ZIP');
        }

        const extractedPath = path.join(DOWNLOAD_FOLDER, extractedCsvFile.entryName);
        zip.extractEntryTo(extractedCsvFile.entryName, DOWNLOAD_FOLDER, false, true);

        /**
         * Work with the CSV starts here
         */

        //  1) The CSV content
        const content: CsvRow[] = await ReadCSV(extractedPath);

        //  2) Filter to use
        const filterToUse = decoded.reportJob.filterConfig;
        console.log('filterToUse', filterToUse);

        //  3) Process the filters
        const filteredRows = filterDataRows(content, filterToUse);

        let accountId: string = '';
        let direction: string = '';
        for (let item of filteredRows) {
            accountId = item.account_id;
            direction = item.direction;
            break;
        }
        
        //  4) Group the report based on the content of "reportJob"
        const reportResult: { success: boolean; groupResults: any[] } = await runReportJob(decoded.reportJob, filteredRows, decoded.includeMessages);

        //  5) Check if the user wants to start a Cron Job

        //  6) Generate the HTML
        const htmlContent = generateHtmlReport(reportResult.groupResults);

        // 7) Save the HTML version to a file
        const htmlFilename = `report_${Date.now()}.html`;
        const htmlPath = path.join(DOWNLOAD_FOLDER, htmlFilename);
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');

        //  8) Create a new token for the download
        const token = jwt.sign({ 
            filePath: htmlPath
            }, process.env.JWT_SECRET || 'secret123', {
            expiresIn: '5d',
        });

        //  9) Send the email if needed
        if (decoded.emailTo) {
            const groupBy = decoded.reportJob?.groupBy;
            const groupLabel = Array.isArray(groupBy) && typeof groupBy[0] === 'object' && 'name' in groupBy[0]
                ? groupBy[0].name
                : `Grouped by ${(groupBy as string[]).join(', ') || 'Unknown'}`;
            const html = generateEmailBody({
                accountId,
                direction,
                reportName: groupLabel,
                downloadUrl: `${Config.SERVER_URL}/reports/${token}`
                });
                
            await sendReportEmail(decoded.emailTo, Config.EMAIL_SUBJECT, html);
            console.log(`Email sent to ${decoded.emailTo}`);
        }

        // 10) inform
        console.log(`Report processed ${request_id}`);

    } catch (err: any) {
        console.error(`Error checking report ${request_id}:`, err.stack || err.message || err);
    }

}
