import axios from 'axios';
// import fs from 'fs';
import { Config } from '../config';
import path from 'path';
import fs from 'fs/promises';


// export default async function downloadReport(startDate: string, endDate: string, product: 'SMS' | 'MESSAGES'): Promise<string> {
//     const auth = {
//         username: Config.VONAGE_API_KEY,
//         password: Config.VONAGE_API_SECRET
//     };

//     const params = {
//         account_id: Config.VONAGE_ACCOUNT_ID,
//         product: 'SMS',
//         direction: 'outbound',
//         date_start: '2025-04-01T00:00:00Z',
//         date_end: '2025-04-07T23:59:59Z'
//     };

//     try {
//         const response = await axios.get('https://api.nexmo.com/v2/reports/records', {
//             auth,
//             params,
//             headers: {
//                 'Accept': 'text/csv'
//             },
//             responseType: 'stream'
//         });

//         const writer = fs.createWriteStream('report.csv');
//         response.data.pipe(writer);

//         return new Promise((resolve, reject) => {
//             writer.on('finish', () => resolve('report.csv'));
//             writer.on('error', reject);
//         });
//     } catch (error: any) {
//         console.error('Error downloading report:', error.response ? error.response.data : error.message);
//         throw error;
//     }
// }

export async function downloadTestReport(): Promise<string> {
    try {
        const testFilePath = path.resolve(__dirname, '../../OTHER/marc-report_SMS_6ef638c4_20250401.csv');

        // Optionally, copy to standard location if needed
        const destination = path.resolve(__dirname, '../../report.csv');
        await fs.copyFile(testFilePath, destination);

        return destination; // so your app continues using the same file name
    } catch (error: any) {
        console.error('Error preparing test report:', error.message);
        throw error;
    }
}


