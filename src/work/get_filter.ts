import FilterConfig from "../interface/filter_config";

/**
 * We have some predefined reports, to make life easier for customers
 */
export function getReportByName(name: 'undeliveredByCountry') : FilterConfig | null {
    if (name == 'undeliveredByCountry') {
        return filterByRegex('status', 'failed')
    } else {
        return null;
    }
}

/**
 * This will find any string (using regex) in the given column
 */
function filterByRegex(columnName: string, text: string) : FilterConfig {
    return {
        logic: 'OR',
        filters: [
            {
                field: columnName,
                type: 'text',
                operator: 'regex',
                value: text,
                options: 'i'        //  This makes the Reged case-insensitive
                // + Matches if the whole client_ref contains 'walter' (case-insensitive)
            }
        ],
    }
}

/**
 * These are all the possible filters to run
 */
const filterConfig: FilterConfig = {
    logic: 'OR',
    filters: [
        {
            field: 'client_ref',
            type: 'split',
            separator: '|',
            position: 1,
            operator: 'equals',
            value: 'b0c072ca-58fa-4205-afed-279dbd425565',
        },
        {
            field: 'client_ref',
            type: 'split',
            separator: '|',
            position: 1,
            operator: 'regex',
            value: '^b0c072ca',
        },
        {
            field: 'client_ref',
            type: 'split',
            separator: '|',
            position: 1,
            operator: 'beforeDash',
            value: 'b0c072ca',
        },
        {
            field: 'client_ref',
            type: 'text',
            operator: 'regex',
            value: 'walter',
            options: 'i',
        },
        {
            field: 'client_ref',
            type: 'split',
            separator: '/',
            position: 'last',
            operator: 'exists',
        },
        {
            field: 'client_ref',
            type: 'text',
            operator: 'afterChar',
            value: '/',
        },
        {
            field: 'client_ref',
            type: 'text',
            operator: 'regex',
            value: '/$',
        },
    ],
};