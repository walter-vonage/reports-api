import CsvRow from '../interface/csv_row';
import GroupResult from '../interface/group_result';
import GroupConfig from '../interface/group_config';
import ReportJob from '../interface/rport_job';
import filterAndGroupReport from './filter_and_group_report';
import generateHtmlReport from './generate_report';

/**
 * Runs the report job using filtered CSV rows, applies grouping, aggregation, and sends email if needed.
 */
export async function runReportJob(
    reportJob: ReportJob,
    filteredRows: CsvRow[],
): Promise<{ success: boolean; groupResults: any[] }> {

    const groupBy = reportJob.groupBy;
    const filterConfig = reportJob.filterConfig;
    const aggregations = reportJob.aggregations;

    // Determine the list of fields to check (flatten if needed)
    const groupFields = (groupBy as GroupConfig[])[0]?.fields
        ? (groupBy as GroupConfig[]).flatMap(g => g.fields)
        : (groupBy as string[]);

    // Normalize date fields (truncate ISO timestamps to YYYY-MM-DD)
    for (const row of filteredRows) {
        for (const field of groupFields) {
            const val = row[field];
            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
                row[field] = val.slice(0, 10);
            }
        }
    }

    const groupResults: { name: string; groupBy: string[]; result: GroupResult[] }[] = [];

    if ((groupBy as GroupConfig[])[0]?.fields) {
        const result = filterAndGroupReport(
            filteredRows,
            filterConfig,
            groupBy as GroupConfig[],
            aggregations,
        );
        groupResults.push({ name: 'Grouped Report', groupBy: groupFields, result });
    } else {
        const result = filterAndGroupReport(
            filteredRows, 
            filterConfig, 
            groupFields, 
            aggregations, 
        );
        groupResults.push({ name: `Grouped by ${groupFields.join(', ')}`, groupBy: groupFields, result });
    }

    return { success: true, groupResults };
}




