const process = require('process');
const config = require('../../config');
const colors = require('colors');
const log = require('loglevel');
const path = require('path');
//const parentModule = require('parent-module')

module.exports.UBTTtoBTT = (amount) => amount / 1000000;
module.exports.BTTtoUBTT = (amount) => amount * 1000000;

module.exports.log = (function() {
    const getTimestamp = () => `[${new Date().toLocaleString("ru", {day:'numeric', month:'numeric', year:'numeric', hour:'numeric', minute: 'numeric', second: 'numeric'}).yellow}]`;
    //log.setDefaultLevel(config.get('LOG_LEVEL'));
	log.setDefaultLevel(2);
    this.trace = (msg, caller) => log.trace(getTimestamp() + ` (${'TRACE'.gray}) ` + msg);
    this.debug = (msg, caller) => log.debug(getTimestamp() + ` (${'DEBUG'.gray}) ` + msg);
    this.info  = (msg, caller) => log.info(getTimestamp()  + ` (${'INFO'.brightBlue}) ` + msg);
    this.warn  = (msg, caller) => log.warn(getTimestamp()  + ` (${'WARN'.brightYellow}) ` + msg);
    this.error = (msg, caller) => log.error(getTimestamp() + ` (${'ERROR'.brightRed}) ` + msg);

    return this;
})()

