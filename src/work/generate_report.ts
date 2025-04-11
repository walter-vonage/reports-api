import GroupResult from "../interface/group_result";

export default function generateHtmlReportPivot(groupSets: { name: string; result: GroupResult[] }[]): string {
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
      </style>
    </head>
    <body>
    <div class="container">
    <h1>Reports API Summary</h1>`;

    for (const section of groupSets) {
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

        // 2. Pivot table
        const allAggs = new Set<string>();
        section.result.forEach(gr => {
            Object.keys(gr.aggregations || {}).forEach(k => allAggs.add(k));
        });

        const aggregationHeaders = Array.from(allAggs);
        html += `<table>
            <thead>
                <tr>
                    <th>Group</th>
                    ${aggregationHeaders.map(label => `<th>${label}</th>`).join('')}
                </tr>
            </thead>
            <tbody>`;

        // Group rows by first group field
        const groupedByFirst: Record<string, GroupResult[]> = {};
        for (const row of section.result) {
            const firstField = Object.keys(row.group)[0];
            const firstValue = row.group[firstField];
            groupedByFirst[firstValue] = groupedByFirst[firstValue] || [];
            groupedByFirst[firstValue].push(row);
        }

        for (const [mainGroup, rows] of Object.entries(groupedByFirst)) {
            html += `<tr class="bold">
                <td>${mainGroup}</td>
                ${aggregationHeaders.map(() => `<td></td>`).join('')}
            </tr>`;

            const totals: Record<string, number> = {};

            for (const row of rows) {
                const subLabel = Object.values(row.group).slice(1).join(' / ');
                html += `<tr>
                    <td class="indent-1">${subLabel}</td>
                    ${aggregationHeaders.map(label => {
                    const val = parseFloat(row.aggregations?.[label] || '0');
                    totals[label] = (totals[label] || 0) + val;
                    return `<td>${row.aggregations?.[label] || ''}</td>`;
                }).join('')}
                </tr>`;
            }

            html += `<tr class="bold">
                <td>Total for ${mainGroup}</td>
                ${aggregationHeaders.map(label => `<td>${totals[label]?.toFixed(2) || '0.00'}</td>`).join('')}
            </tr>`;
        }

        html += `</tbody></table>`;
    }

    html += `</div></body></html>`;
    return html;
}
