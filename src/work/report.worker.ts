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

    // Extract report configuration from job
    const groupBy = reportJob.groupBy;               // Fields or named groups to group the data by
    const filterConfig = reportJob.filterConfig;     // Filtering logic already applied (optional)
    const aggregations = reportJob.aggregations;     // Aggregation instructions (e.g. sum, count, etc.)

    // Will store each group result set
    const groupResults: { name: string; groupBy: string[]; result: GroupResult[] }[] = [];

    // Determine whether groupBy is a named config (with .fields) or a simple string array
    if ((groupBy as GroupConfig[])[0]?.fields) {
        // If groupBy is a list of named group configs (e.g. { name: "By Country", fields: ["country_name"] })
        const result = filterAndGroupReport(
            filteredRows,
            filterConfig,
            groupBy as GroupConfig[],
            aggregations,
        );
        groupResults.push({ name: 'Grouped Report', groupBy: (groupBy as GroupConfig[]).flatMap(g => g.fields), result });
    } else {
        // If groupBy is just an array of strings like ["status", "country_name"]
        const fields = groupBy as string[];
        const result = filterAndGroupReport(
            filteredRows, 
            filterConfig, 
            fields, 
            aggregations, 
        );
        groupResults.push({ name: `Grouped by ${fields.join(', ')}`, groupBy: fields, result });
    }

    // Return the grouping output
    return { success: true, groupResults };
}



