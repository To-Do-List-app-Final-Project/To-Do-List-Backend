const contextUtils = require('./contextUtils');
const idUtils = require('./idUtils')
const log4js = require("log4js")

log4js.configure({
    appenders: {
        console: {
            type: "console",
        },
        datelog: {
            type: "dateFile",
            filename: "./logs/logic",
            pattern: "yyyy-MM-dd.log",
            alwaysIncludePattern: true,
            compress: true,
            numBackups: 100,
        },
        // more...
    },
    categories: {
        default: {
            appenders: ["console"],
            level: "debug",
        },
        datelog: {
            // 指定为上面定义的appender，如果不指定，无法写入
            appenders: ["datelog"],
            level: "ALL", // 指定等级
        },
    },

    // for pm2...
    pm2: true,
    disableClustering: true, // not sure...
})


const logDeal = (message, ...args) => {
    let trackId = contextUtils.get('fwTrack');
    trackId = trackId ? trackId : `${new Date().getTime()}${idUtils.countId()}${Math.floor(Math.random()*1000)}`;
    let msg = `[${trackId}] ${message}`;
    return { message: msg, args };
}

const getLogger = (name) => {
    const log = log4js.getLogger(name);
    return {
        debug: (message, ...args) => {
            let r = logDeal(message, ...args);
            log.debug(r.message, ...r.args);
        },
        info: (message, ...args) => {
            let r = logDeal(message, ...args);
            log.info(r.message, ...r.args);
        },
        warn: (message, ...args) => {
            let r = logDeal(message, ...args);
            log.warn(r.message, ...r.args);
        },
        error: (message, ...args) => {
            let r = logDeal(message, ...args);
            log.error(r.message, ...r.args);
        },
        fatal: (message, ...args) => {
            let r = logDeal(message, ...args);
            log.fatal(r.message, ...r.args);
        },
    }
}


module.exports = {
    getLogger,
}
