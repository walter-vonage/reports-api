import Aggregation from "../interface/aggregation";
import CsvRow from "../interface/csv_row";
import FilterConfig from "../interface/filter_config";
import GroupResult from "../interface/group_result";
import { filterDataRows } from "./filter_data";

export default function filterAndGroupReport(
    rows: CsvRow[],
    filterConfig: FilterConfig,
    groupByFields: string[] = [],
    aggregations: Aggregation[] = [],
    includeMessages: boolean // If include "messages" or not
): GroupResult[] {

    const filtered = filterDataRows(rows, filterConfig);

    const grouped: Record<string, CsvRow[]> = {};
    filtered.forEach(row => {
        const key = groupByFields.map(f => row[f] || 'undefined').join('|');
        grouped[key] = grouped[key] || [];
        grouped[key].push(row);
    });

    const output: GroupResult[] = Object.entries(grouped).map(([key, messages]) => {
        const keys = key.split('|');
        const group: Record<string, string> = {};
        groupByFields.forEach((field, idx) => group[field] = keys[idx]);

        const aggregationResults: Record<string, any> = {};
        for (const agg of aggregations) {
            const values = messages.map(m => m[agg.field]);
            switch (agg.type) {
                case 'sum':
                    aggregationResults[agg.label] = values.reduce((s, v) => s + parseFloat(v || '0'), 0).toFixed(5);
                    break;
                case 'count':
                    aggregationResults[agg.label] = values.filter(v => v != null).length;
                    break;
                case 'countDistinct':
                    aggregationResults[agg.label] = new Set(values.filter(v => v != null)).size;
                    break;
            }
        }

        return {
            group,
            count: messages.length,
            aggregations: aggregationResults,
            ...(includeMessages && {
                messages: messages.map(m => ({
                    date: m.date_received,
                    to: m.to,
                    status: m.status,
                    price: m.total_price,
                    client_ref: m.client_ref,
                    error: m.error_code_description
                }))
            })
        };
    });

    return output;
}