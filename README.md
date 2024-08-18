# Jordan Tax Department - Automation Script

Softwares needed -

- Node js 18 version (can be installed from [node js archive](https://nodejs.org/en/blog/release/v18.12.0))
- Git (Not necessary but good to have in case of bug or patch fixes) [git for windows](https://git-scm.com/download/win)

Config file looks something like this, make sure its placed in root file with appropriate credentials:

```
{
  "read_file_path_from_root": "files/read",
  "move_completed_file_path": "files/completed",
  "move_failed_file_path": "files/failed",
  "move_failed_payload_path": "files/failed_payload",
  "show_logs_in_console": true,
  "cron_expression": "*/30 * * * * *",
  "tax_dept_config": {
    "services_url": "https://gzb-services.onrender.com",
    "base_url": "https://backend.jofotara.gov.jo/core/invoices/",
    "client_id": "XXXX",
    "client_secret": "XXXX"
  },
  "xml_request_config": {
    "discount_percentage": 8.0,
    "tax_number": 2737663,
    "customer_name": "مؤسسة نديم عواد للبرمجيات",
    "seller_supplier_party_id": 11472081,
    "client_id": "XXXX",
    "client_secret": "XXXX"
  }
}
```

You can replace `cron_expression` and `show_logs_in_console` based on your requirements.

STEPS to use:

1: Clone the repository using `git clone https://github.com/sedhha/automation-script-jordan-tax-dept.git` if you don't have git installed, just download the repository from [here](https://github.com/sedhha/automation-script-jordan-tax-dept/tree/main)

2: Using your terminal, install the dependencies using the command: `npm install` or `yarn`.
You can check if your node version is correctly installed or not using command: `node -v` this should output a version which should be `>= 18` and `<= 19`.
3: Make sure your `config.json` is up to date and correct in `src/config.json` folder.
4: Once `npm install` succeeds, open another terminal and run the command: `npm run initiate` or `yarn initiate`.

The task will keep running in background as long as its not terminated by user or machine shuts down. All the logs can be found in the console (if its enabled in config) or inside [application-log](logs/) folder.

All the files can be tracked inside [files](files/) folder.
