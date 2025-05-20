# Vonage Reports API
This project performs several tasks using Vonage Reports API.
1) Based on your parameters, it will download a report from Reports API.
2) Once the report is downloaded, it will apply FILTERS and GROUPING you define from your JSON request.

## Example of JSON to send
Let's see some examples of what you can send:
```
{
    "apiKey": "XXXXX",
    "apiSecret": "XXXX",
    "accountId": "xxx",
    "startDate": "2025-04-01",
    "endDate": "2025-04-02",
    "product": "MESSAGES",
    "direction": "outbound",
    "include_subaccounts": false,
    "include_messages": false,
    "emailTo": "my.email@vonage.com",
    "cron": {
        "startAt": "14:51",
        "getDataFromPrevious": 15,
        "unit": "days",
        "mon": false,
        "tue": false,
        "wed": false,
        "thu": false,
        "fri": false,
        "sat": false,
        "sun": false
    }
    "reportJob": {
        "filterConfig": {
            "logic": "AND",
            "filters": []
        },
        "groupBy": [
            {
                "name": "Grouped by Country",
                "fields": ["country"]
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
```

## These are parameters defined in the Vonage Reports API

```apiKey```: The Api Key to use.

```apiSecret```: The Api Secret to use.

```accountId```: This can be the same master Api Key defined or any sub-key.

```startDate```: Starting date for download the data inside the report.

```endDate```: End date for download the data inside the report.

```product```: This is also what Vonage product you want to download data from.

```direction```: If this report will include inbound or outbound data.

```include_subaccounts```: If the accountId value is a master key, this parameter defines if sub-accounts must be included or not.

```include_messages```: This defines if you want to download the text of messages sent.


## These are for the resulting report

```emailTo```: Send this to receive a link to your final report.

## Repeat the process
If you send this object, we will create a cron process which will be executed as specified in the parameters.
```
"cron": {
    "startAt": "14:51",
    "getDataFromPrevious": 15,
    "unit": "days",
    "mon": false,
    "tue": false,
    "wed": false,
    "thu": false,
    "fri": false,
    "sat": false,
    "sun": false
}
```
Where:
```startAt``` is the time the report will run again. IMPORTANT: THE FORMAT MUST BE 24-HOURS AND THE SERVER RUNS IN UTC (WITHOUT SUMMER TIME CHANGE)

```getDataFromPrevious``` this is the amount of days or hours we will grab to generate the report. Starting for the current date and time.

```unit``` this can be either ```days``` or ```hours``` 

Set to ```true``` or ```false``` for the days you want the report to run.


# ReportJob
This last object is the one used to define the filtering and the grouping of the data.

# Filtering
Before grouping the data you can filter it and leave only what you want to focus on.
You can define one or more filters for the data. Use ```AND``` or ```OR```  to include all the conditions or just one of them.

```
FilterConfig = {
    logic: 'OR',
    filters: [...]
}
```

The following are all the operators for filtering. Let us know if you need any other.

## Don't include rows if column country is empty
This will filter out rows without any value in the column ```country```

```
{
    "field": "country",
    "type": "text",
    "operator": "regex",
    "value": "^(?!$).*",
    "options": "i" // optional: case-insensitive
}
```
Or you can use this:
```
{
  field: "country",
  type: "text",
  operator: "exists"
}
```

## Don't include rows if column country contains 'undefined'
You can also filter out for some values you are interested in
```
{
  field: "country",
  type: "text",
  operator: "regex",
  value: "^(?!.*undefined)", // Negative lookahead
  options: "i" // case-insensitive
}
```
Or something like:
```
{
  field: "country",
  type: "text",
  operator: "regex",
  value: "^(?!undefined$).*",
  options: "i"
}
```
Combining both in one filtering:
```
{
  logic: "AND",
  filters: [
    {
      field: "country",
      type: "text",
      operator: "exists"
    },
    {
      field: "country",
      type: "text",
      operator: "regex",
      value: "^(?!undefined$).*",
      options: "i"
    }
  ]
}
```
This means:
- Field exists (not empty)
- Not equal to "undefined"

## Split
Matches if the 2nd segment (index 1) of client_ref (split by '|') is exactly the word ```walter```
```
  filters: [
    {
      field: 'client_ref',
      type: 'split',
      separator: '|',
      position: 1,
      operator: 'equals',
      value: 'walter'
    },
```

## Split with Regex
The same as before but using Regex. Matches if the 2nd segment starts with 'b0c099ca'
```
    {
      field: 'client_ref',
      type: 'split',
      separator: '|',
      position: 1,
      operator: 'regex',
      value: '^b0c099ca'
    },
```

## beforeDash
Matches if the part BEFORE the first separator in the 2nd segment equals 'b0c099ca'
```
    {
      field: 'client_ref',
      type: 'split',
      separator: '|',
      position: 1,
      operator: 'beforeDash',
      value: 'b0c099ca'
    },
```

## Regex
Matches if the whole client_ref contains 'walter' (case-insensitive)
```
    {
      field: 'client_ref',
      type: 'text',
      operator: 'regex',
      value: 'walter',
      options: 'i'
    },
```
 
Similar to before but this matches if client_ref ends with a slash
```
    {
      field: 'client_ref',
      type: 'text',
      operator: 'regex',
      value: '/$'
    },
```

## Last Exists
Matches if splitting by '/' yields a last segment that is NOT empty
NOTE: Will NOT match if client_ref ends with a slash like "abc/def/"
```
    {
      field: 'client_ref',
      type: 'split',
      separator: '/',
      position: 'last',
      operator: 'exists'
    },
```

## afterChar
Matches if there’s a slash '/' and something comes after it (even just one character)
```
    {
      field: 'client_ref',
      type: 'text',
      operator: 'afterChar',
      value: '/'
    },
```

# Grouping
Once the report is filtered (or not) you can group the results so they are better organised.
You can add one or more grouping. These are some ideas:

## Group by Phone
You can also define a name for the grouping so it's easy to understand.
```
"groupBy": [{
    "name": "Grouped by Recipient",
    "fields": ["to"]
}]
```

## Group by messages by Day
This will group messages by the column called ```date_received```
```
"groupBy": [{
    "name": "Messages by Day",
    "fields": ["date_received"],
    "convertToDate": true
}]
```

# Aggregations
Aggregations allow you to get totals or average of the grouped information in the report. You can define one or many.
The options are: ```sum``` ```count``` ```countDistinct```  ```avg```

## Example with SUM
If you want to sum all the resulting messages in each group, define something like:
```
"aggregations": [{
    "type": "count",
    "field": "id",
    "label": "Messages Sent"
}]
```

## Example with Average
You can ask the service to calculate the average latency value.
```
"aggregations": [{
    "type": "sum",
    "field": "latency",
    "label": "Total Latency"
}, {
    "type": "count",
    "field": "latency",
    "label": "Delivery Count"
}, {
    "type": "avg",
    "field": "latency",
    "label": "Avg Latency (ms)"
}]
```

# Endpoints
These are all the current endpoints:

## Download and create a report
Send a ```POST``` request to ```/reports``` - This is an example of a JSON body:
```
{
    "apiKey": "XXXXX",
    "apiSecret": "XXXXXXX",
    "accountId": "XXXXXXX",
    "startDate": "2025-04-01",
    "endDate": "2025-04-02",
    "product": "MESSAGES",
    "direction": "outbound",
    "include_subaccounts": false,
    "include_messages": false,
    "emailTo": "my.email@vonage.com",
    "cron": {
        "startAt": "14:51",
        "getDataFromPrevious": 15,
        "unit": "days",
        "mon": false,
        "tue": false,
        "wed": false,
        "thu": false,
        "fri": false,
        "sat": false,
        "sun": false
    }
    "reportJob": {
        "filterConfig": {
            "logic": "AND",
            "filters": []
        },
        "groupBy": [
            {
                "name": "Grouped by Country",
                "fields": ["country"]
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
```

## Download and create a report without sending customer credentials
If you want to create a report without exposing sensitive data, then you must first create an entry with the ApiKey and ApiSecret. They will be stored for using on other requests.

Send a ```POST``` request to ```/customers/credentials``` with a JSON body like this:
```
{
    "name": "My Customer Name",
    "apiKey": "XXXXX",
    "apiSecret": "XXXXXXX",
    "accountId": "XXXX"
}
```
Once you do that, you can then simply make the call by ```name```
```
{
    "customerName": "My Customer Name",
    "startDate": "2025-04-01",
    "endDate": "2025-04-02",
    "product": "MESSAGES",
    "direction": "outbound",
    "include_subaccounts": false,
    "include_messages": false,
    ... etc
```

## Upload a report manually
If you already have a downloaded Vonage Reports API and want to proceed with the filtering and/or grouping, then send a POST request to ```reports/upload``` and send ```form-data``` key:value pairs.

```file```: The CSV file to be processed. Currently we support up to 1 GB of data.

```reportJob```: [send the full reportJob object as mentioned before. Send it as text]


## List Cron Jobs
To know what cron jobs are running, send a GET request to ```/crons/list``` 
You will get a list of current running jobs, like this:
```
{
    "count": 1,
    "jobs": [
        {
            "startAt": "14:51",
            "getDataFromPrevious": 15,
            "unit": "days",
            "mon": false,
            "tue": false,
            "wed": false,
            "thu": false,
            "fri": true,
            "sat": false,
            "sun": false,
            "id": "490219"
        }
    ]
}
```

## Stop Cron Job
To stop a current running cron job, send a POST request to ```/crons/cancel``` with any of the IDs. For example:
```
{
    "cronId": "214615"
}
```

# For Developers
If you are planning to change this code or improve it, here are some considerations.

## Source code
This is a Typescript project. To be able to use it in Vonage's VCR, see below some minor considerations.

## Folder structure
```
/src
    index.ts : Main starting file
    config.ts : Main basic configuration
    /work
        - Single files for single tasks
    /interface
        - Data interface
    /constants
        - Data constants
/vcr.yml
/package.json
/dist
    - All the files converted from Typescript to Javascript
```

## Run locally
You just need to have Typescript installed (tsc)
Typescript is compiled and the result is placed inside the ```dist``` folder.
```
npm run dev
```
This will execute:
- tsc
- node dist/index.js

## Deploy to VCR
Just run ```npm run deploy:vcr``` This will do the following tasks:
- Convert the Typescript files into Javascript
- Copy the ```vcr.yml``` file into ```/dist```
- Copy the ```package.json``` file into ```/dist```
- Copy the ```node_modules``` folder into ```/dist```
- run ```vcr deploy```

## Test with POSTMAN
Check the file ```REPORTS PROJECT.postman_collection.json``` and use it yourself. In the ```variables``` section, update with the URL you want (current one is the actual deployed VCR instace from my account) 

## Configure Email
We are using ```nodemailer``` to send Emails. Any server is fine but for this project we are using Gmail.
Go here https://support.google.com/accounts/answer/185833?hl=en&authuser=2 and click on ```Create and manage your app passwords``` to add a password (which is different from your password to login to Gmail)


