const util = require("../exports/util")
const log4js = require("log4js")
const logUtils = require('../exports/logUtils').getLogger('datelog');
// log4js.configure({
//     appenders: {
//         console: {
//             type: "console",
//         },
//         datelog: {
//             type: "dateFile",
//             filename: "./logs/logic",
//             pattern: "yyyy-MM-dd.log",
//             alwaysIncludePattern: true,
//             compress: true,
//             numBackups: 100,
//         },
//         // more...
//     },
//     categories: {
//         default: {
//             appenders: ["console"],
//             level: "debug",
//         },
//         datelog: {
//             // 指定为上面定义的appender，如果不指定，无法写入
//             appenders: ["datelog"],
//             level: "ALL", // 指定等级
//         },
//     },

//     // for pm2...
//     pm2: true,
//     disableClustering: true, // not sure...
// })
// let logFile = log4js.getLogger("datelog")

const warn = async (req, content) => {
    try {
        logUtils.warn(content)
        return null
    } catch (error) {
        return new Error("logger error: " + error)
    }
}
const error = async (req, content) => {
    try {
        if (util.isError(content)) {
            content = content.message
        }
        logUtils.error(content)
        return null
    } catch (error) {
        return new Error("logger error: " + error)
    }
}
const debug = async (req, content) => {
    try {
        logUtils.debug(content)
        return null
    } catch (error) {
        return new Error("logger error: " + error)
    }
}
const info = async (req, content) => {
    try {
        logUtils.info(content)
        return null
    } catch (error) {
        return new Error("logger error: " + error)
    }
}

module.exports = { warn, error, debug, info }
