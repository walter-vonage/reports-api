import axios from 'axios';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { runReportJob } from './report.worker';
import ReadCSV from './read_csv';
import { sendReportEmail } from './emailService';
import CsvRow from '../interface/csv_row';
import ReportRequestModel from '../interface/report_request';
import ReportJob from '../interface/rport_job';
import { Config } from '../config';
import generateHtmlReport from './generate_report';
import AdmZip from 'adm-zip';
import { filterDataRows } from './filter_data';

/**
 * Check if there is any report pending to process
 */
export default async function CheckPeriodicallyForDownloadedReports(REPORT_REQUESTS: Array<ReportRequestModel>) {
    
    const DOWNLOAD_FOLDER = path.resolve(__dirname, '../../downloads');

    setInterval(async () => {

        for (let i = REPORT_REQUESTS.length - 1; i >= 0; i--) {
            
            const req: ReportRequestModel = REPORT_REQUESTS[i];

            try {
                // Decode request context from token
                const decoded = jwt.verify(req.token, process.env.JWT_SECRET || 'secret123') as {
                    VONAGE_USERNAME: string,
                    VONAGE_PASSWORD: string,
                    emailTo?: string;
                    includeRows: boolean;
                    includeMessages: boolean;
                    reportJob: ReportJob;
                };
                console.log('GET TO: ' + req.statusUrl)
                console.dir(decoded, { depth: null, colors: true });

                if (!decoded.reportJob) {
                    console.warn(`Skipping report ${req.request_id} — missing reportJob in token`);
                    continue;
                }

                // Check report status
                const authString = `Basic ${Buffer.from(`${decoded.VONAGE_USERNAME}:${decoded.VONAGE_PASSWORD}`).toString('base64')}`;
                const response = await axios.get(req.statusUrl, {
                    headers: {
                      'Authorization': authString,
                      'Content-Type': 'application/json',  // Optional
                      'Accept': 'application/json'         // Optional
                    }
                  });
                  
                if (!response.data._links?.download_report?.href) {
                    console.log(`** Report ${req.request_id} not ready yet`);
                    continue;
                }

                const downloadUrl = response.data._links.download_report.href;
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

                console.log(`Downloaded ZIP file to ${filePath}`);

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

                console.log(`Extracted CSV to ${extractedPath}`);

                /**
                 * Work with the CSV starts here
                 */

                if (!decoded || !decoded.reportJob || !decoded.reportJob.filterConfig) {
                    console.log(`** Report ${req.request_id} not ready yet`);
                    continue;
                }

                //  1) The CSV content
                const content: CsvRow[] = await ReadCSV(extractedPath);

                //  2) Filter to use
                const filterToUse = decoded.reportJob.filterConfig;
                console.log('filterToUse', filterToUse);

                //  3) Process the filters
                const filteredRows = filterDataRows(content, filterToUse);
                console.log('filteredRows to process')
                console.dir(filteredRows)
                
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
                    const html = `
                        <p>Your report is ready!</p>
                        <p><strong>Report name:</strong> ${groupLabel}</p>
                        <p><a href="${Config.SERVER_URL}/reports/${token}">Download your CSV file</a></p>
                    `;
                    await sendReportEmail(decoded.emailTo, 'Your SMS Report is Ready', html);
                    console.log(`Email sent to ${decoded.emailTo}`);
                }

                // 10) Cleanup
                REPORT_REQUESTS.splice(i, 1);
                console.log(`Processed and removed report ${req.request_id}`);

            } catch (err: any) {
                console.error(`Error checking report ${req.request_id}:`, err.stack || err.message || err);
            }
        }
    }, 30 * 1000); // Check every 30 seconds
}
