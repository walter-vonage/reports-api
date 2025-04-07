import fs from 'fs';
import csv from 'csv-parser';
import CsvRow from '../interface/csv_row';

export default function ReadCSV(filePath: string = './mockup_data.csv'): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
        const results: CsvRow[] = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row: CsvRow) => {
                results.push(row);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

