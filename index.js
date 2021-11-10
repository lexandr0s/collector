const {log} = require('./src/libs/utils.js');
const {version} = require('./package.json');

log.info(`Collector v. ${version} started.`);
require('./src/collect');

/*try {
	log.info(`Collector v. ${version} started.`);
	require('./src/collect');
} catch (error) {
    log.error(error);
}*/
