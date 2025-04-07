import GroupResult from "../interface/group_result";

export default function generateHtmlReport(groupSets: { name: string; result: GroupResult[] }[]): string {
    let html = `<h2>Reports API Summary</h2>`;
    for (const section of groupSets) {
        html += `<h2>${section.name}</h2>`;
        for (const group of section.result) {
            html += `<h3>Group: ${JSON.stringify(group.group)}</h3>`;
            html += `<p><strong>Count:</strong> ${group.count}</p>`;
            for (const [label, value] of Object.entries(group.aggregations || {})) {
                html += `<p><strong>${label}:</strong> ${value}</p>`;
            }
            if (group.messages) {
                html += `<table border="1" cellpadding="5" cellspacing="0"><thead><tr><th>Date</th><th>To</th><th>Status</th><th>Price</th><th>Template</th><th>Error</th></tr></thead><tbody>`;
                for (const msg of group.messages) {
                    html += `<tr>
                                <td>${msg.date}</td><td>${msg.to}</td><td>${msg.status}</td>
                                <td>${msg.price}</td><td>${msg.client_ref}</td><td>${msg.error}</td>
                            </tr>`;
                }
                html += `</tbody></table><br/>`;
            }
        }
    }
    return html;
}