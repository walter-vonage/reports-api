import fs from 'fs';
import path from 'path';
import { loadCSV, CsvRow } from './loadCSV'; // adjust path if needed

export default async function AiProcessQuestion(question: string, filename: string): Promise<string> {

    const DOWNLOAD_FOLDER = path.resolve(__dirname, '../downloads');

    // Security: prevent path traversal attacks
    if (filename.includes('/') || filename.includes('..')) {
        return `It looks like this report file is not valid...`;
    }

    const filePath = path.join(DOWNLOAD_FOLDER, filename);

    if (!fs.existsSync(filePath)) {
        return `It looks like there's no generated report. Try generating one first...`;
    }

    let data: CsvRow[];
    try {
        data = await loadCSV(filePath);
        console.log('Rows loaded:', data.length);
    } catch (err) {
        console.error('Error loading CSV:', err);
        return `There was an error loading this last report. Can you try again or create a support ticket?`;
    }

    if (question.toLowerCase().includes('top countries')) {
        const summary = summarizeByCountry(data);
        return getRandomResponseStyle(summary);
    }

    return `Hey, I'm still learning! Try asking me about the "top countries" for now.`;
}

function summarizeByCountry(data: CsvRow[]): string {
    const counts: Record<string, number> = {};

    for (const row of data) {
        const country = row.country || 'Unknown';
        counts[country] = (counts[country] || 0) + 1;
    }
    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    return sorted.map(([country, count]) => `${country}: ${count}`).join('\n');
}

function getRandomResponseStyle(summary: string): string {
    const templates = [
        `Here's the breakdown you asked for:\n\n${summary}`,
        `Ah, the top countries? Right away, boss:\n${summary}`,
        `Here's the top-performing countries ☕:\n${summary}`,
        `Based on the data, these countries are leading the charts:\n${summary}`,
        `After analyzing and crunching numbers:\n${summary}`
    ];
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
}
