# Vonage Reports API
This project will filter the content of the big CSV file downloaded and then it will apply grouping.

## Send a basic JSON request from Postman
This is an example to upload a downloaded file from your computer. Replace ```file=@"/Users/warodriguez/Documents/VONAGE/REPORTS/OTHER/marc-report_SMS_6ef638c4_20250401.csv"```

```
curl --location 'http://localhost:3000/reports/upload' \
--form 'file=@"/Users/warodriguez/Documents/VONAGE/REPORTS/OTHER/marc-report_SMS_6ef638c4_20250401.csv"' \
--form 'reportName="undeliveredByCountry"' \
--form 'startDate="2025-04-01"' \
--form 'endDate="2025-04-07"' \
--form 'emailTo="walter.rodriguez@vonage.com"' \
--form 'cron="{
    \"startAt\": \"21:01\",
    \"mon\": true,
    \"tue\": true,
    \"wed\": true,
    \"thu\": true,
    \"fri\": true,
    \"sat\": false,
    \"sun\": false
  }"' \
--form 'includeRows="0"' \
--form 'includeMessages="0"'
```

1) The process will open the uploaded file
2) Will apply a preconfigured filtering:
    a) Get all undelivered messages
    b) Will group by country and count the records
3) Then it will send an email to ```walter.rodriguez@vonage.com```
4) Then it will create a ```Cron Job``` to repeat this process every ```weekday``` at ```9pm```

### Notes
- ```emailTo``` is optional
- ```cron``` is optional
- ```includeRows``` accepts a 0 or 1 value. If set to 0, the process will include in the Email report all the rows filtered from the CSV (not recommended if the CSV file is large)
- ```includeMessages``` accepts a 0 or 1 value. If set to 0, the process will include in the Email report all the messages when showing the grouping from the CSV (not recommended if the CSV file is large)

  

