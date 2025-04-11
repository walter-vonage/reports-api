import axios from 'axios';
import jwt from 'jsonwebtoken';
import ReportJob from '../interface/rport_job';
import { createCronExpressionFromJson } from './create_cron_from_json';
import CustomerSecret from '../interface/customer_secret';
import ReportRequestModel from '../interface/report_request';
import { Request, Response } from 'express';

const CALLBACK_URL = 'https://webhook.site/your-callback-id'; // optional

export default async function initiateDownloadReport(
    req: Request, 
    res: Response,
    CUSTOMER_SECRETS: Array<CustomerSecret>, 
    REPORT_REQUESTS: Array<ReportRequestModel>,
    VONAGE_USERNAME: string,
    VONAGE_PASSWORD: string,
    ACCOUNT_ID: string,
    startDate: string,
    endDate: string,
    product: 'SMS' | 'MESSAGES',
    include_subaccounts: boolean,
    include_messages: boolean,
    direction: 'outbound' | 'inbound',
    emailTo: string | undefined,
    includeRows: boolean,
    includeMessages: boolean,
    reportJob: ReportJob,
    checkForCron: boolean
): Promise<{ request_id: string; statusUrl: string; token: string }> {
    
    const requestPayload = {
        product,
        account_id: ACCOUNT_ID,
        direction,
        date_start: `${startDate}T00:00:00+00:00`,
        date_end: `${endDate}T00:00:00+00:00`,
        include_subaccounts,
        include_messages,
        callback_url: CALLBACK_URL, // This is your public endpoint
    };

    const basicAuth = Buffer.from(`${VONAGE_USERNAME}:${VONAGE_PASSWORD}`).toString('base64');

    const headers = {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
    };    

    console.log(requestPayload)
    console.log(headers)

    const response = await axios.post(
        'https://api.nexmo.com/v2/reports', 
        requestPayload, 
        { headers }
    );

    console.log('Vonage reponse: ')
    console.dir(response.data)

    const encriptedData = jwt.sign({ 
        VONAGE_USERNAME,
        VONAGE_PASSWORD,    
        emailTo,
        includeRows,
        includeMessages,
        reportJob
     }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '5d',
    });

    if (checkForCron) {
        createCronExpressionFromJson(
            CUSTOMER_SECRETS, 
            REPORT_REQUESTS, 
            req, res)
    }

    return {
        request_id: response.data.request_id,
        statusUrl: response.data._links.self.href,
        token: encriptedData
    };
}
