import fs from 'fs';
import path from 'path';
import config from "../config.json" assert { type: 'json' };

const getAllXMLPaths = (dirPath) => {
    try {
        const allFiles = fs.readdirSync(dirPath);
        const xmlFiles = allFiles.filter(file => path.extname(file) === '.xml');
        return xmlFiles;

    } catch (err) {
        console.error('Error reading directory:', err.message);
        return [];
    }
}
const getListOfAllReadFiles = () => {
    const readFilePath = config.read_file_path_from_root;
    const xmlPaths = getAllXMLPaths(readFilePath);
    console.info(`Reading files from ${xmlPaths.join(', ')}`);
    return xmlPaths;
}

export { getListOfAllReadFiles }