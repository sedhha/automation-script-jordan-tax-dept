import { format as _format, transports as _transports, createLogger } from 'winston';
import 'winston-daily-rotate-file';

const logFormat = _format.combine(
    _format.timestamp(),
    _format.printf(info => `${info.timestamp} - [LEVEL=${info.level}]: ${info.message}`)
);

const transport = new _transports.DailyRotateFile({
    filename: 'application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    dirname: 'logs',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
});

const logger = createLogger({
    level: 'info',
    transports: [transport],
});

export { logger }
