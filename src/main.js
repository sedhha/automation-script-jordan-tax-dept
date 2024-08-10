import cron from 'node-cron';
import config from './config.json' assert { type: 'json' };
import { main } from './modules/xml.js';
import { logger } from './utils/logger.js';

// Write logs every 30 seconds
cron.schedule(config.cron_expression, () => {
    main()
        .then(() => logger.info('Cron process success for this cycle.'))
        .catch((err) => {
            logger.error(`Cron process failed for this cycle. Error: ${err.message}`);
        });
});

logger.info('Schedule started for ' + config.cron_expression);
