import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import config from '../config.json' assert { type: 'json' };
const postToTaxDeparment = async (xml, fileName) => {
    const base_url = config.tax_dept_config.services_url;
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.39.0',
        'Accept': 'application/json'
    };
    const body = {
        xml,
        config: config.xml_request_config
    }
    await fetch(`${base_url}/jtd/validate-api-to-jtd`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    })
        .then(response =>
            response.json()
                .then(data => {
                    if (data.success) {
                        logger.info(`[file_name=${fileName}] Successfully pushed xml to tax department.`);
                        return { error: false };
                    }
                    logger.error(`[file_name=${fileName}] Error while posting to Tax Department (${data?.result?.message}): ${JSON.stringify(data?.result?.error_details)}`);
                    return { error: true };
                })
        ).catch(error => {
            logger.error(`[file_name=${fileName}] Error while making request when posting to Tax Department: ${error.message}`);
            return { error: true }
        })
}
export { postToTaxDeparment };