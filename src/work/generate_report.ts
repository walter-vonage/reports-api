import GroupResult from "../interface/group_result";

export default function generateHtmlReportPivot(
    groupSets: { name: string; result: GroupResult[] }[],
    startDate: string,
    endDate: string,
    product: 'SMS' | 'MESSAGES',
    include_subaccounts: boolean,
    include_messages: boolean,
    direction: 'outbound' | 'inbound',
): string {

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
      <style>
        body { font-family: Arial, sans-serif; background-color: #f8f9fa; }
        .container { max-width: 960px; margin: auto; background: white; padding: 20px; border-radius: 8px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        .indent-1 { padding-left: 20px; }
        .indent-2 { padding-left: 40px; }
        .bold { font-weight: bold; background-color: #f9f9f9; }
        .bar-container { height: 20px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
        .bar { height: 100%; background: #007bff; }
        .totals { background-color: #dfefff; }
        .json-cell {
            background: #f0f8ff;
            padding: 4px;
            border: 1px dashed #007bff;
            border-radius: 4px;
            font-size: 90%;
            margin-bottom: 2px;
        }
        .json-cell div {
            margin-bottom: 2px;
        }
        .json-rest {
            font-size: 90%;
            color: #555;
        }
      </style>
    </head>
    <body>
    <div class="container">

    <h1>Reports API Summary</h1>
    
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
            html += `<h2>${section.name}</h2>`;

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
                    ${groupHeaders.map(label => `<th>${label}</th>`).join('')}
                    ${aggregationHeaders.map(label => `<th>${label}</th>`).join('')}
                </tr>
            </thead>
            <tbody>`;

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
    }

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


