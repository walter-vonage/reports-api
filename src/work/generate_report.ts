import GroupResult from "../interface/group_result";
import { Config } from "../config";

export default function generateHtmlReportPivot(
    groupSets: { name: string; result: GroupResult[] }[],
    startDate: string,
    endDate: string,
    product: 'SMS' | 'MESSAGES',
    include_subaccounts: boolean,
    include_messages: boolean,
    direction: 'outbound' | 'inbound',
): string {

    const VERSION = Config.VERSION;
    const SERVER_URL = Config.SERVER_URL;

    const useBlueBars = false;

    const formatCellValue = (val: string) => {
        if (typeof val == 'string') {
            if (!val || val.toLowerCase() === 'undefined') return '';
        }

        const { parsed, rest } = tryParseJsonFragment(val);
        if (!parsed) return escapeHtml(val);

        const parsedHtml = Object.entries(parsed)
            .map(([k, v]) => `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</div>`)
            .join('');

        return `
            <div class="json-cell">${parsedHtml}</div>
            ${rest ? `<div class="json-rest">${escapeHtml(rest)}</div>` : ''}
        `;
    };

    let html = `
    <html>
    <head>
        <link rel="stylesheet" href="${SERVER_URL}/report.css">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
    <div class="container">

    <h1>Reports API Summary</h1>
    <p>
        Version: ${VERSION}
    </p>
    `;

    for (const section of groupSets) {

        const allAggs = new Set<string>();
        section.result.forEach(gr => {
            Object.keys(gr.aggregations || {}).forEach(k => allAggs.add(k));
        });

        const aggregationHeaders = Array.from(allAggs);
        const groupHeaders = Object.keys(section.result[0]?.group || {});

        html += `<table>
            <thead>
                <tr>
                ${groupHeaders.map((label, idx) => `
                    <th onclick="sortTable(event, ${idx})" data-sorted="">
                    <div class="sortable-header">
                        <span>${label}</span>
                        <span class="sort-arrow">↓</span>
                    </div>
                    </th>`).join('')}
                ${aggregationHeaders.map((label, idx) => `
                    <th onclick="sortTable(event, ${groupHeaders.length + idx})" data-sorted="">
                    <div class="sortable-header">
                        <span>${label}</span>
                        <span class="sort-arrow">↓</span>
                    </div>
                    </th>`).join('')}
                </tr>
            </thead>
        <tbody>
        `;

        const chartData: { date: string, value: number }[] = [];
        const dateField = groupHeaders.find(h => h.toLowerCase().includes('date'));
        const valueField = aggregationHeaders.find(h => h.toLowerCase().includes('total') || h.toLowerCase().includes('count'));

        for (const row of section.result) {
            html += `<tr>
                ${groupHeaders.map(field => {
                let val = row.group?.[field] || '';
                if (field.toLowerCase().includes('date') && typeof val === 'string') {
                    val = val.split('T')[0];
                }
                return `<td>${formatCellValue(val)}</td>`;
            }).join('')}
                ${aggregationHeaders.map(field => `<td>${formatCellValue(row.aggregations?.[field] || '')}</td>`).join('')}
            </tr>`;

            if (dateField && valueField) {
                let dateVal = row.group?.[dateField] || '';
                if (typeof dateVal === 'string') dateVal = dateVal.split('T')[0];
                chartData.push({
                    date: dateVal,
                    value: parseFloat(row.aggregations?.[valueField] || '0')
                });
            }
        }

        const totals: Record<string, number> = {};
        section.result.forEach(row => {
            aggregationHeaders.forEach(field => {
                const val = parseFloat(row.aggregations?.[field] || '0');
                totals[field] = (totals[field] || 0) + val;
            });
        });
        html += `<tr class="bold totals">
            ${groupHeaders.map(() => `<td></td>`).join('')}
            ${aggregationHeaders.map(field => `<td>${totals[field]?.toFixed(2) || '0.00'}</td>`).join('')}
        </tr>`;

        html += `</tbody></table>`;

        //  BUTTON TO DOWNLOAD PIVOT TABLE AS CSV
        const downloadPivotAsCSV = `
        <div class="pt-3 pb-3">
            <button onclick="downloadCSV()" class="btn btn-secondary">Download CSV</button>
        </div>        
        `
        html += downloadPivotAsCSV;

        if (chartData.length) {
            const sortedData = chartData.sort((a, b) => a.date.localeCompare(b.date));
            const labels = sortedData.map(d => d.date);
            const values = sortedData.map(d => d.value);
            html += `
            <h3>Chart: ${valueField} over ${dateField}</h3>
            <canvas id="chart-${dateField}-${valueField}"></canvas>
            <script>
                const ctx = document.getElementById('chart-${dateField}-${valueField}').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ${JSON.stringify(labels)},
                        datasets: [{
                            label: '${valueField}',
                            data: ${JSON.stringify(values)},
                            fill: false,
                            borderColor: 'blue',
                            tension: 0.1
                        }]
                    }
                });
            </script>`;
        }

        html += `<h2>${section.name}</h2>`;
        const groupFields = Object.keys(section.result[0]?.group || {});
        for (const field of groupFields) {
            html += renderGroupFieldBreakdown(section.result, field);
        }
    }

    html += `
    <script src="${SERVER_URL}/report.js"></script>
    </div></body></html>`;
    return html;
}

function tryParseJsonFragment(value: string): { parsed?: any; rest?: string } {
    if (typeof value !== 'string') return { parsed: undefined, rest: '' };

    const trimmed = value.trim();
    const match = trimmed.match(/^({[\s\S]*?})(.*)$/);
    if (!match) return { parsed: undefined, rest: value };

    const rawJsonPart = match[1].replace(/\\"/g, '"');
    try {
        const parsed = JSON.parse(rawJsonPart);
        return { parsed, rest: match[2]?.trim() };
    } catch {
        return { parsed: undefined, rest: value };
    }
}

function escapeHtml(unsafe: any): string {
    if (typeof unsafe !== 'string') {
        return String(unsafe ?? '');
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderGroupFieldBreakdown(result: GroupResult[], field: string): string {
    const counts: Record<string, number> = {};

    for (const row of result) {
        const value = row.group?.[field] || 'unknown';
        counts[value] = (counts[value] || 0) + (row.count || 1);
    }

    const entries = Object.entries(counts)
        .sort((a, b) => {
            const dateA = Date.parse(a[0]);
            const dateB = Date.parse(b[0]);
            if (!isNaN(dateA) && !isNaN(dateB)) {
                return dateA - dateB; // ascending date order
            }
            return b[1] - a[1]; // fallback: sort by count desc
        })
        .map(([val, count]) => `<li><strong>${val}:</strong> ${count}</li>`)
        .join('');

    return `<div style="margin-top:10px;margin-bottom:10px;">
        <h4>Summary by <code>${field}</code></h4>
        <ul>${entries}</ul>
    </div>`;
}
