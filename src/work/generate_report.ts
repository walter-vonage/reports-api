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

    /**
     * Formats any possible JSON content inside any field
     */
    const formatCellValue = (val: string) => {

        if (typeof val == 'string') {
            if (!val || val.toLowerCase() === 'undefined') return '';
        }

        const { parsed, rest } = tryParseJsonFragment(val);
        if (!parsed) return escapeHtml(val); // escape normal strings

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
    </head>
    <body>
    <div class="container">

    <h1>Reports API Summary</h1>
    Version: ${VERSION}
    
    <div class="border rounded-4 pt-3 pb-3">
        <table class="table">
            <tr>
                <td>Start date:</td>
                <td>${startDate}</td>
            </tr>
            <tr>
                <td>End date:</td>
                <td>${endDate}</td>
            </tr>
            <tr>
                <td>
                    Product:
                </td>
                <td>
                    ${product}
                </td>
            </tr>
            <tr>
                <td>
                    Include Subaccounts:
                </td>
                <td>
                    ${include_subaccounts ? 'Yes' : 'No'}
                </td>
            </tr>
            <tr>
                <td>
                    Include Messages:
                </td>
                <td>
                    ${include_messages ? 'Yes' : 'No'}
                </td>
            </tr>
            <tr>
                <td>
                    Direction:
                </td>
                <td>
                    ${direction}
                </td>
            </tr>
        </table>
    </div>
    `;

    for (const section of groupSets) {

        if (useBlueBars) {

            // 1. Bar chart summary
            const summaryBars: { label: string; value: number }[] = section.result.map(gr => {
                const label = Object.values(gr.group).join(" / ");
                const count = gr.count || 0;
                return { label, value: count };
            });

            const maxValue = Math.max(...summaryBars.map(b => b.value));
            html += `<div style="margin-bottom: 20px;">`;
            for (const bar of summaryBars) {
                const width = ((bar.value / maxValue) * 100).toFixed(1);
                html += `
                    <div style="margin-bottom: 6px;">
                        <div><strong>${bar.label}</strong> (${bar.value})</div>
                        <div class="bar-container"><div class="bar" style="width:${width}%"></div></div>
                    </div>`;
            }
            html += `</div>`;
        }

        // 2. Pivot table
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

        for (const row of section.result) {
            html += `<tr>
                ${groupHeaders.map(field => `<td>${formatCellValue(row.group?.[field] || '')}</td>`).join('')}
                ${aggregationHeaders.map(field => `<td>${formatCellValue(row.aggregations?.[field] || '')}</td>`).join('')}
            </tr>`;
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


        html += `<h2>${section.name}</h2>`;

        // For each group field, show a breakdown
        const groupFields = Object.keys(section.result[0]?.group || {});
        for (const field of groupFields) {
            html += renderGroupFieldBreakdown(section.result, field);
        }

    }

    html += `
    <script src="${SERVER_URL}/report.js"></script>
    `
    html += `</div></body></html>`;
    return html;
}

/**
 * If the content of any field has a JSON object, it will try to parse it
 */
function tryParseJsonFragment(value: string): { parsed?: any; rest?: string } {
    if (typeof value !== 'string') return { parsed: undefined, rest: '' };

    const trimmed = value.trim();

    // This regex matches a full JSON object at the start of the string
    const match = trimmed.match(/^({[\s\S]*?})(.*)$/);
    if (!match) return { parsed: undefined, rest: value };

    const rawJsonPart = match[1].replace(/\\"/g, '"'); // unescape quotes
    try {
        const parsed = JSON.parse(rawJsonPart);
        console.log('Parsed JSON fragment:', parsed);
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
        .sort((a, b) => b[1] - a[1]) // sort descending
        .map(([val, count]) => `<li><strong>${val}:</strong> ${count}</li>`)
        .join('');

    return `<div style="margin-top:10px;margin-bottom:10px;">
        <h4>Summary by <code>${field}</code></h4>
        <ul>${entries}</ul>
    </div>`;
}

