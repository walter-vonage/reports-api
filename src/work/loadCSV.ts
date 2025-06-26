import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export interface CsvRow {
    [key: string]: string;
}

export function loadCSV(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
        const absolutePath = path.resolve(filePath);

        // Check if file exists first
        if (!fs.existsSync(absolutePath)) {
            return reject(new Error(`CSV file not found at path: ${absolutePath}`));
        }

        const results: CsvRow[] = [];

        fs.createReadStream(absolutePath)
            .pipe(csv())
            .on('data', (data: CsvRow) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}
