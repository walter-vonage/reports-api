import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';

/**
 * User clicks on the link provided in the Email
 */
export default async function DownloadProcessedCSV(req: Request, res: Response) {
    
    const token = req.params.token;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123') as { filePath: string };        

        const filePath = decoded.filePath;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.sendFile(decoded.filePath);
        
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}