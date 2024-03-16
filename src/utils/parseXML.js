import xmlReader from 'xml2js';
import { getListOfAllReadFiles } from './fileHandler.js';
import { logger } from './logger.js';

const main = async () => {
    /*
        1. Get All the Files that need to be processed from a directory.
        2. Read the files and parse the XML content.
        3. Perform the transformations as per the XL shared by Nadeem.
        4. return the transformed JSON data.
    */
    const files = getListOfAllReadFiles();
    logger.info(`Files to be processed: ${files.join(', ')}`);
}

main();