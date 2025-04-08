import FilterConfig from "../interface/filter_config";
import ReportJob from "../interface/rport_job";

/**
 * These are the available report names
 */
type ReportNamesType = 'deliverByCountry' | 'wordAfterSymbol' | 'multiDayTrend' | 'latencyAnalysisByCountry' | 'errorForFailedMessages';

/**
 * Options for sending data from the POSTMAN payload
 */
interface DataModel {
    columnName?: string,
    countryName?: string,
    wordToFind?: string,
    symbol?: string
}

/**
 * We have some predefined reports, to make life easier for customers
 */
export function getReportByName(name: ReportNamesType, emailTo: string | undefined, startDate: string, endDate: string, data: DataModel): ReportJob | null {

    console.log("Report name", name)

    if (name == 'deliverByCountry') {
        const countryName: string | undefined = data.countryName;
        const columnName: string | undefined = data.columnName;
        return getDeliveredByCoountry(startDate, endDate, countryName, columnName, emailTo)

    } else if (name == 'wordAfterSymbol') {
        const columnName: string | undefined = data.columnName;
        const wordToFind: string | undefined = data.wordToFind;
        const symbol: string | undefined = data.symbol;
        return findWordAfterCharacter(startDate, endDate, emailTo, columnName, wordToFind, symbol)

    } else if (name == 'multiDayTrend') {
        return multiDayTrends(startDate, endDate, emailTo);

    } else if (name == 'latencyAnalysisByCountry') {
        return latencyAnalysisByCountry(startDate, endDate, emailTo);

    } else if (name == 'errorForFailedMessages') {
        return errorForFailedMessages(startDate, endDate, emailTo);

    } else {
        return null;
    }
}

/**
 * Ideal for understanding what errors you have in your failed messages
 */
function errorForFailedMessages(startDate: string, endDate: string, emailTo: string | undefined): ReportJob {
    return {
        "startDate": startDate,
        "endDate": endDate,
        "emailTo": emailTo,
        "filterConfig": {
            "logic": "AND",
            "filters": [
                {
                    "field": "status",
                    "type": "text",
                    "operator": "equals",
                    "value": "failed"
                }
            ]
        },
        "groupBy": [
            {
                "name": "Failures by Country and Error",
                "fields": ["country_name", "error_code_description"]
            }
        ],
        "aggregations": [
            {
                "type": "count",
                "field": "id",
                "label": "Failed Count"
            }
        ]
    }
}


/**
 * Ideal if you want to check average delivery latency per country.
 */
function latencyAnalysisByCountry(startDate: string, endDate: string, emailTo: string | undefined): ReportJob {
    return {
        "startDate": startDate,
        "endDate": endDate,
        "emailTo": emailTo,
        "filterConfig": {
            "logic": "AND",
            "filters": [
                {
                    "field": "status",
                    "type": "text",
                    "operator": "equals",
                    "value": "delivered"
                }
            ]
        },
        "groupBy": [
            {
                "name": "Delivery Latency by Country",
                "fields": ["country_name"]
            }
        ],
        "aggregations": [
            {
                "type": "sum",
                "field": "latency",
                "label": "Total Latency"
            },
            {
                "type": "count",
                "field": "latency",
                "label": "Delivery Count"
            },
            {
                "type": "avg",
                "field": "latency",
                "label": "Avg Latency (ms)"
            }
        ]
    }
}

/**
 * Idea for tracking how many messages were received each day.
 */
function multiDayTrends(startDate: string, endDate: string, emailTo: string | undefined): ReportJob {
    return {
        "startDate": startDate,
        "endDate": endDate,
        "emailTo": emailTo,
        "filterConfig": {
            "logic": "AND",
            "filters": []
        },
        "groupBy": [
            {
                "name": "Messages by Day",
                "fields": ["date_received"],
                "convertToDate": true
            }
        ],
        "aggregations": [
            {
                "type": "count",
                "field": "id",
                "label": "Messages Sent"
            }
        ]
    }
}

/**
 * Ideal if you want to filter the CSV where the "client_ref" column contains the word "Marc" exists after a "*"
 */
function findWordAfterCharacter(startDate: string, endDate: string, emailTo: string | undefined, columnName: string | undefined, wordToFind: string | undefined, symbol: string | undefined): ReportJob {
    const escaped = `\\${symbol}.*${wordToFind}`;
    return {
        "startDate": startDate,
        "endDate": endDate,
        "emailTo": emailTo,
        "filterConfig": {
            "logic": "AND",
            "filters": [
                {
                    "field": columnName ? columnName : "",
                    "type": "text",
                    "operator": "regex",
                    "value": escaped,
                    "options": "i"
                }
            ]
        },
        "groupBy": [
            {
                "name": "Grouped by Recipient",
                "fields": ["to"]
            }
        ],
        "aggregations": [
            {
                "type": "count",
                "field": "id",
                "label": "Total Messages"
            },
            {
                "type": "sum",
                "field": "total_price",
                "label": "Total Spend"
            }
        ]
    }
}

/**
 * Ideal if you want to filter one specific country and group by a column name like "client_ref" and then: count, sum and count different error types
 */
function getDeliveredByCoountry(startDate: string, endDate: string, countryName: string | undefined, columnName: string | undefined, emailTo: string | undefined): ReportJob {
    return {
        "startDate": startDate,
        "endDate": endDate,
        "emailTo": emailTo ? emailTo : "",
        "filterConfig": {
            "logic": "AND",
            "filters": [
                {
                    "field": "status",
                    "type": "text",
                    "operator": "equals",
                    "value": "delivered"
                },
                {
                    "field": columnName ? columnName : "",
                    "type": "text",
                    "operator": "equals",
                    "value": countryName ? countryName : ""
                }
            ]
        },
        "groupBy": [
            {
                "name": "Delivered per Template (" + countryName + " only)",
                "fields": ["client_ref"]
            }
        ],
        "aggregations": [
            {
                "type": "count",
                "field": "id",
                "label": "Messages Sent"
            },
            {
                "type": "sum",
                "field": "total_price",
                "label": "Total Spend (€)"
            },
            {
                "type": "countDistinct",
                "field": "error_code_description",
                "label": "Unique Delivery Statuses"
            }
        ]
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