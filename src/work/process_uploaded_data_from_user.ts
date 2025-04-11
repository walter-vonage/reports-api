import { Request, Response } from 'express';
import ReportJob from '../interface/rport_job';
import CsvRow from '../interface/csv_row';
import ReadCSV from './read_csv';
import { filterDataRows } from './filter_data';
import { runReportJob } from './report.worker';
import generateHtmlReport from './generate_report';
import { Config } from '../config';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

/**
 * User can provide a CSV manually
 */
export default async function ProcessUploadedDataFromUser(req: Request, res: Response) {
    
    const file = req.file;
    const includeRows = req.body.includeRows;
    const includeMessages = req.body.includeMessages;
    const reportJob: ReportJob = req.body.reportJob ? JSON.parse( req.body.reportJob ) : null;

    //  Validate
    if (!file || !reportJob) {
        res.status(200).json({
            success: false,
            message: 'Need to upload a CSV file and a reportJob object'
        })
        return;
    }
    
    //  The uploaded file
    const filePath = file?.path;
    
    // 1) Parse CSV
    const content: CsvRow[] = await ReadCSV(filePath);

    //  2) Filter to use
    const filterToUse = reportJob.filterConfig;
    console.log('filterToUse', filterToUse)

    //  3) Process the filters
    const filteredRows = filterDataRows(content, filterToUse);
    console.log('filteredRows to process')
    console.dir(filteredRows)

    //  4) Group the report based on the content of "reportJob"
    const reportResult: { success: boolean; groupResults: any[] } = await runReportJob(reportJob, filteredRows, includeMessages);

    //  5) Check if the user wants to start a Cron Job
    const cronJson = req.body.cron ? JSON.parse(req.body.cron) : null;
    if (cronJson) {
        // createCronExpressionFromJson(reportJob, filterToUse, cronJson, includeMessages);
    }

    //  6) Generate the HTML
    const htmlContent = generateHtmlReport(reportResult.groupResults);
    
    // 7) Save the HTML version to a file
    const DOWNLOAD_FOLDER = path.resolve(__dirname, '../downloads');
    const htmlFilename = `report_${Date.now()}.html`;
    const htmlPath = path.join(DOWNLOAD_FOLDER, htmlFilename);
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    //  8) Create a new token for the download
    const token = jwt.sign({ 
        filePath: htmlPath
        }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '5d',
    });

    //  7) Respond
    res.json({
        success: true,
        count: filteredRows.length,
        ...(includeRows && { rows: filteredRows }), // <- conditionally include "rows" which is the content of the CSV in the response
        reportResult,
        htmlPage: `${Config.SERVER_URL}/reports/${token}`
    })
    
}