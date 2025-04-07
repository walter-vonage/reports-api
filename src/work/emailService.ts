import nodemailer from 'nodemailer';
import { Config } from '../config';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: Config.EMAIL_USER,
        pass: Config.EMAIL_PASS,
    },
});

/**
 * Sends an HTML email using nodemailer
 */
export async function sendReportEmail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
        from: `"Vonage Reports API Report" <${Config.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    await transporter.sendMail(mailOptions);
}
