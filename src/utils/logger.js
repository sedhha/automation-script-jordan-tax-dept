import config from '../config.json' assert { type: 'json' };
import { format as _format, transports as _transports, createLogger } from 'winston';
import 'winston-daily-rotate-file';

const logFormat = _format.combine(
    _format.timestamp(),
    _format.printf(info => `${info.timestamp} - [LEVEL=${info.level}]: ${info.message}`)
);

const fileTransport = new _transports.DailyRotateFile({
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    dirname: 'logs',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
});

// Create an array to hold the transports
let transportsArray = [fileTransport];

if (config.show_logs_in_console) {
    const consoleTransport = new _transports.Console({
        format: _format.combine(
            _format.colorize(),  // Optional, adds color to the console output
            logFormat
        )
    });

    // Add consoleTransport to the array if show_logs_in_console is true
    transportsArray.push(consoleTransport);
}

const logger = createLogger({
    level: 'info',
    transports: transportsArray,
});

export { logger }

