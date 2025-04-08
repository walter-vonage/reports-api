import Aggregation from "../interface/aggregation";
import CsvRow from "../interface/csv_row";
import FilterConfig from "../interface/filter_config";
import GroupConfig from "../interface/group_config";
import GroupResult from "../interface/group_result";
import { filterDataRows } from "./filter_data";

export default function filterAndGroupReport(
    rows: CsvRow[],
    filterConfig: FilterConfig,
    groupBy: GroupConfig[] | string[] = [],
    aggregations: Aggregation[] = [],
    includeMessages: boolean // If include "messages" or not
): GroupResult[] {

    const filtered = filterDataRows(rows, filterConfig);

    const isGroupObject = Array.isArray(groupBy) && typeof groupBy[0] === 'object';

    const groupFields: string[] = isGroupObject
        ? (groupBy as GroupConfig[]).flatMap(g => g.fields)
        : (groupBy as string[]);

    const convertFields: Set<string> = new Set(
        (isGroupObject ? (groupBy as GroupConfig[]) : []).flatMap(cfg =>
            cfg.convertToDate ? cfg.fields : []
        )
    );

    const grouped: Record<string, CsvRow[]> = {};
    filtered.forEach(row => {
        const key = groupFields.map(f => {
            let val = row[f] || 'undefined';
            if (convertFields.has(f) && val.includes('T')) {
                val = val.substring(0, 10); // Only keep YYYY-MM-DD
            }
            return val;
        }).join('|');
        grouped[key] = grouped[key] || [];
        grouped[key].push(row);
    });

    const output: GroupResult[] = Object.entries(grouped).map(([key, messages]) => {
        const keys = key.split('|');
        const group: Record<string, string> = {};
        groupFields.forEach((field, idx) => group[field] = keys[idx]);

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
                case 'avg':
                    const numericValues = values.map(v => parseFloat(v || '0')).filter(v => !isNaN(v));
                    const avg = numericValues.reduce((sum, val) => sum + val, 0) / (numericValues.length || 1);
                    aggregationResults[agg.label] = avg.toFixed(2);
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