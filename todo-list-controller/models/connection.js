const mongoose = require("mongoose")
let dayjs = require("dayjs")
let utc = require("dayjs/plugin/utc")
const log = require('../exports/logUtils').getLogger('fw.mongoConnect')
dayjs.extend(utc)

/**
 * 定义一个枚举类型的结构体，并能验证值
 * @param v  可以是正则
 * @param defaultValue  默认值
 * @param message  错误提示
 * @returns {{lowercase: boolean, trim: boolean, type: StringConstructor, validate: {validator: (function(*): boolean), message: string}}}
 */
const validatorString = (v, defaultValue = "", message = "Invalid Status") => {
    return {
        type: String,
        lowercase: true,
        validate: {
            validator: function (v) {
                return new RegExp(v).test(v)
            },
            message: message,
        },
        default: defaultValue,
        trim: true,
    }
}

const refTable = (tableName) => {
    return {
        type: mongoose.Schema.Types.ObjectId,
        ref: tableName,
    }
}

// 开启调试模式，控制台输出操作日志
//mongoose.set('debug', true);
mongoose.set("debug", function (collectionName, method, query, doc) {
    log.debug("AliPanda："+ process.env.USE_DB +" " + collectionName + "." + method + " (" + JSON.stringify(query, null, 2) + ")")
})
// const pacsdb = mongoose.connection.useDb("pacs")
const pacsdb = mongoose.connection.useDb(process.env.USE_DB || "todo-list")


module.exports = { pacsdb, mongoose, dayjs, validatorString, refTable }
