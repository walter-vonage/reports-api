import axios from 'axios';
import jwt from 'jsonwebtoken';
import ReportJob from '../interface/rport_job';
import { createCronExpressionFromJson } from './create_cron_from_json';
import CustomerSecret from '../interface/customer_secret';
import { Request, Response } from 'express';
import { Config } from '../config';

export default async function initiateDownloadReport(
    req: Request, 
    res: Response,
    CUSTOMER_SECRETS: Array<CustomerSecret>, 
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
    reportJob: ReportJob,
    checkForCron: boolean
): Promise<{ request_id: string; statusUrl: string; token: string }> {
    
    const encriptedData = jwt.sign({ 
        VONAGE_USERNAME,
        VONAGE_PASSWORD,    
        emailTo,
        reportJob,
        //  New fields
        ACCOUNT_ID,
        startDate,
        endDate,
        product,
        include_subaccounts,
        include_messages,
        direction,
     }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '5d',
    });

    const requestPayload = {
        product,
        account_id: ACCOUNT_ID,
        direction,
        date_start: `${startDate}T00:00:00+00:00`,
        date_end: `${endDate}T23:59:59+00:00`,
        include_subaccounts: include_subaccounts ? 'true' : 'false',
        include_message: include_messages ? 'true' : 'false',
        callback_url: Config.SERVER_URL + '/reports/callback/' + encriptedData, // Vonage will tell me when the report is ready
    };

    const basicAuth = Buffer.from(`${VONAGE_USERNAME}:${VONAGE_PASSWORD}`).toString('base64');

    const headers = {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
    };    
    const response = await axios.post(
        'https://api.nexmo.com/v2/reports', 
        requestPayload, 
        { headers }
    );

    console.log('Vonage reponse: ')
    console.dir(response.data)

    if (checkForCron) {
        createCronExpressionFromJson(
            CUSTOMER_SECRETS, 
            req, res)
    }

    return {
        request_id: response.data.request_id,
        statusUrl: response.data._links.self.href,
        token: encriptedData
    };
}
