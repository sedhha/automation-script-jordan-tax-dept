import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import config from '../config.json' assert { type: 'json' };
import { nanoid } from 'nanoid';
import fs from 'fs';

const performFailureSteps = (
    failure_id,
    fail_dump_path,
    fileName,
    body,
    error
) => {
    const failure_file = {
        failure_id,
        file_name: fileName,
        error: error,
        attempted_payload: body,
    };
    fs.writeFileSync(
        `${fail_dump_path}/${failure_id}.json`,
        JSON.stringify(failure_file)
    );
};

const postToTaxDeparment = async (xml, fileName, fail_dump_path) => {
    const base_url = config.tax_dept_config.services_url;
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'PostmanRuntime/7.39.0',
        'Accept': 'application/json',
    };
    const body = {
        xml,
        config: config.xml_request_config,
    };
    await fetch(`${base_url}/jtd/validate-api-to-jtd`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    })
        .then((response) =>
            response.json().then((data) => {
                if (data.success) {
                    logger.info(
                        `[file_name=${fileName}] Successfully pushed xml to tax department.`
                    );
                    return { error: false };
                }
                const failure_id = nanoid();
                logger.error(
                    `[file_name=${fileName}] [failure_id=${failure_id}] Error while posting to Tax Department (${data?.result?.message
                    }): ${JSON.stringify(data?.result?.error_details)}`
                );
                performFailureSteps(failure_id, fail_dump_path, fileName, body, data);
                return { error: true };
            })
        )
        .catch((error) => {
            const failure_id = nanoid();
            logger.error(
                `[file_name=${fileName}] [failure_id=${failure_id}] Error while making request when posting to Tax Department: ${error.message}`
            );
            performFailureSteps(failure_id, fail_dump_path, fileName, body, {
                name: error.name,
                message: error.message,
                stack: error.stack,
            });
            return { error: true };
        });
};
export { postToTaxDeparment };
