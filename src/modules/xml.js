import { getListOfAllReadFiles } from '../utils/fileHandler.js';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import config from '../config.json' assert { type: 'json' };
import { postToTaxDeparment } from './request_handler.js';
const perform_operation_on_xml = async (xml_path) => {
    const current_path = `${config.read_file_path_from_root}/${xml_path}`;
    try {
        const xml_string = fs.readFileSync(current_path, 'utf-8');
        const { error } = await postToTaxDeparment(
            xml_string,
            current_path,
            config.move_failed_payload_path
        );
        if (error)
            throw new Error(
                "Couldn't complete the request to Jordan Tax Dept Servers. Please check logs for more details."
            );
        const complete_path = path.join(
            config.move_completed_file_path,
            path.basename(xml_path)
        );
        fs.renameSync(current_path, complete_path);
        logger.info(`XML Operation completed for the file: ${xml_path}`);
    } catch (e) {
        logger.error(`Error while reading xml file: ${e.message}`);
        const failed_path = path.join(
            config.move_failed_file_path,
            path.basename(xml_path)
        );
        fs.renameSync(current_path, failed_path);
        logger.error(`File moved to failed path due to error: ${xml_path}`);
    }
};

const operate_xml = async () => {
    logger.info(`New Operation started on ${new Date().toISOString()}`);
    const files = getListOfAllReadFiles();
    const all_files = files.join(', ');
    logger.info('Reading following xml files - ' + all_files);
    for (let i = 0; i < files.length; i++) {
        const pre_message = `Operating on file - ${files[i]} (${i + 1}/${files.length
            })`;
        logger.info(pre_message);
        await perform_operation_on_xml(files[i]);
        logger.info(
            `Operation completed on file - ${files[i]} (${i + 1}/${files.length})`
        );
    }
};

const main = async () => {
    await operate_xml();
    logger.info('Process Complete\n');
};

export { main };
