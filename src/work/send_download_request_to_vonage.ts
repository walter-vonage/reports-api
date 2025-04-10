import { Request, Response } from 'express';
import { Config } from '../config';
import initiateDownloadReport from './download_report';
import ReportRequestModel from '../interface/report_request';
import CustomerSecret from '../interface/customer_secret';

/**
 * Provide the manual full configurations for the report 
 * in a JSON. Documentation available in the README file
 */
export default async function SendDownloadRequestToVonage(CUSTOMER_SECRETS: Array<CustomerSecret>, REPORT_REQUESTS: Array<ReportRequestModel>, req: Request, res: Response) {
    
    const customerName = req.body.customerName || null;
    let   apiKey = req.body.apiKey || null;
    let   apiSecret = req.body.apiSecret || null;                               
    let   accountId = req.body.accountId || null;
    const startDate = req.body.startDate;                               
    const endDate = req.body.endDate;                                   
    const product = req.body.product || 'SMS';                          
    const direction = req.body.direction || 'outbound';                 
    const include_subaccounts = req.body.include_subaccounts;           
    const emailTo = req.body.emailTo;                                   
    const includeRows = req.body.includeRows;
    const includeMessages = req.body.includeMessages;
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
            return;
        }
    }
    
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
        direction,
        emailTo,
        includeRows,
        includeMessages,
        reportJob,
        true,
    );

    REPORT_REQUESTS.push( response )

    res.status(200).json(response)

}