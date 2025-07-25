import { Config } from "../config";
import { CronSchedule } from "../interface/cron_schedule";
import axios from 'axios';

export function callCronCheckAgain() {
    setTimeout(() => {
        axios.get(`${Config.SERVER_URL}/cron-runner`).catch(console.error);
    }, 60 * 1000)
}

export function calculateDateRangeFromSchedule(schedule: CronSchedule): { startDate: string; endDate: string } {
    const now = new Date();

    const end = new Date(now); // endDate = now
    const start = new Date(now); // startDate = now - range

    if (schedule.unit === 'days') {
        start.setDate(start.getDate() - schedule.getDataFromPrevious);
    } else if (schedule.unit === 'hours') {
        start.setHours(start.getHours() - schedule.getDataFromPrevious);
    }

    const toDateString = (date: Date) => date.toISOString().split('T')[0]; // returns 'YYYY-MM-DD'

    return {
        startDate: toDateString(start),
        endDate: toDateString(end),
    };
}


export function generateUnique6DigitNumber() {
    const crypto = require('crypto');
    // Generate a random number between 0 and 999999
    const randomNum = crypto.randomInt(0, 1000000);
    // Pad the number with leading zeros to ensure it has 6 digits
    const sixDigitNum = String(randomNum).padStart(6, '0');
    return sixDigitNum;
}

// Parses the CronSchedule JSON to extract hour, minute, and enabled days
export function parseCronSchedule(schedule: CronSchedule): { hour: number, minute: number, days: number[] } {
    const [hour, minute] = schedule.startAt.split(':').map(Number);
    const dayMap: Record<string, number> = {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
    };

    const days = Object.entries(schedule)
        .filter(([key, val]) => key in dayMap && val)
        .map(([key]) => dayMap[key]);

    return { hour, minute, days };
}