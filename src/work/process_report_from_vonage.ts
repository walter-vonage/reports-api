import { Request, Response } from 'express';
import path from 'path';
import axios from 'axios';
import fs from 'fs';
import jwt from 'jsonwebtoken';

export async function reportCallbackHandler(req: Request, res: Response) {
    try {
        const { _links, request_id } = req.body;

        if (!_links?.download_report?.href) {
            return res.status(400).json({ message: 'Missing download link' });
        }

        const downloadUrl = _links.download_report.href;
        const filename = `report_${Date.now()}.csv`;
        const filePath = path.resolve(__dirname, '../downloads', filename);

        const response = await axios.get(downloadUrl, { responseType: 'stream' });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise<void>((resolve, reject) => {
            writer.on('finish', () => resolve());
            writer.on('error', reject);
        });

        const token = jwt.sign(
            {
                file: filename,
                request_id,
            },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '5d' }
        );

        console.log(`Report ready for request_id: ${request_id}`);
        console.log(`Saved as: ${filename}`);
        console.log(`JWT token: ${token}`);

        res.status(200).json({ success: true, token });

    } catch (err) {
        console.error('Error in callback handler:', err);
        res.status(500).json({ message: 'Failed to process callback', error: err });
    }
}
