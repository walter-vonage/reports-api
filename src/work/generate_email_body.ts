import { Config } from "../config";

export function generateEmailBody({
    accountId,
    startDate,
    endDate,
    downloadCSVUrl,
    direction,
    reportName,
    downloadUrl
}: {
    accountId: string;
    startDate: string;
    endDate: string;
    downloadCSVUrl: string;
    direction: string;
    reportName: string;
    downloadUrl: string;
}): string {

    const VERSION = Config.VERSION;
    const SERVER_URL = Config.SERVER_URL;

    return `
    <div style="font-family:Helvetica,sans-serif">
        <div style="width:600px;margin:auto">
            <div style="margin:40px 0 44px 0">
                <img src="${SERVER_URL}/logo.png" style="width:45%;height:auto;max-width:100%;border:0" alt="Vonage APIs">
                <h1 style="font-family:Verdana,Helvetica,sans-serif;font-weight:normal;font-size:26px;line-height:38px;margin-top:20px">
                Vonage APIs – Your Vonage Reports API Report is Ready
                </h1>
            </div>
        
            <div style="font-size:16px">
                <p>
                    Hi,<br><br>
                    You recently requested a report from Vonage's API Dashboard.<br>
                    Your report is now ready to download.
                </p>
        
                <hr style="margin:16px 0;background:linear-gradient(to right,#871fff,#fcac98);height:1px;border:0">
        
                <table style="width:100%;font-size:16px">
                    <tr><td style="text-align:left">Account ID</td><td style="text-align:right">${accountId}</td></tr>
                    
                    <tr><td style="text-align:left">Start Date</td><td style="text-align:right">${startDate}</td></tr>
                    <tr><td style="text-align:left">End Date</td><td style="text-align:right">${endDate}</td></tr>

                    <tr><td style="text-align:left">Direction</td><td style="text-align:right">${direction}</td></tr>
                    <tr><td style="text-align:left">Report Name</td><td style="text-align:right">${reportName}</td></tr>
                </table>
        
                <hr style="margin:16px 0;background:linear-gradient(to right,#871fff,#fcac98);height:1px;border:0">
        
                <p>
                    <a href="${downloadUrl}" style="background:#131415;color:#fff;font-size:14px;border-radius:4px;padding:10px 20px;text-decoration:none;display:inline-block;margin-top:12px">
                        View Your Report
                    </a>
                </p>
                <p>
                    <a href="${SERVER_URL}/csv/${downloadCSVUrl}" style="background:#131415;color:#fff;font-size:14px;border-radius:4px;padding:10px 20px;text-decoration:none;display:inline-block;margin-top:12px">
                        Download Vonage's CSV
                    </a>
                </p>
                <!-- 
                <p>
                    <a href="${SERVER_URL}/ai/${downloadCSVUrl}" style="background:#131415;color:#fff;font-size:14px;border-radius:4px;padding:10px 20px;text-decoration:none;display:inline-block;margin-top:12px">
                        Talk to the AI Agent
                    </a>
                </p>
                -->
        
                <p style="margin-top:20px;font-size:14px;color:#555">
                    If you didn’t request this report or believe this is an error, please 
                    <a href="https://help.nexmo.com" style="color:#871fff;text-decoration:none">contact support</a>.
                </p>
        
                <p style="margin-top:40px;line-height:24px;font-size:16px">
                    Regards,<br>
                    The Vonage API Team <br>
                    Application version: ${VERSION}
                </p>
        
                <hr style="margin:40px 0 20px 0;border-top:1px solid #c4cdd5">
        
                <footer style="font-size:12px;color:#919eab">
                    Vonage, 101 Crawfords Corner Road, Suite 2416 • Holmdel, NJ 07733.<br>
                    You received this because you're a registered Vonage APIs user. Do not reply to this email.<br>
                    Questions? Visit the <a href="https://developer.nexmo.com" style="color:#919eab;text-decoration:underline">docs</a> or get <a href="https://help.nexmo.com" style="color:#919eab;text-decoration:underline">support</a>.
                </footer>
                
            </div>
        </div>
    </div>
  `;
}
