import { Request, Response } from 'express';
import CustomerSecret from '../interface/customer_secret';

export default function StoreCustomerCredentials(CUSTOMER_SECRETS: Array<CustomerSecret>, req: Request, res: Response) {
    const name = req.body.name;
    const apiKey = req.body.apiKey;
    const apiSecret = req.body.apiSecret;
    const accountId = req.body.accountId;
    if (name && apiKey && apiSecret && accountId) {
        const exists = CUSTOMER_SECRETS.find((i:CustomerSecret) => i.apiKey == apiKey);
        if (exists) {
            exists.name = name;
            exists.apiSecret = apiSecret;
            exists.accountId = accountId;
        } else {
            CUSTOMER_SECRETS.push({
                name,
                apiKey,
                apiSecret,
                accountId
            })
        }
        res.status(200).json({
            success: true
        })
    } else {
        res.status(200).json({
            success: false,
            message: 'Missing data'
        })
    }
}