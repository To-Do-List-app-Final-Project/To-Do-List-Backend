const util = require("./util")

/**
 * 设置一个带状态码的错误信息对象
 * @param {*} code
 * @param {*} error
 * @returns
 */
const setError = (code, error) => {
    return new Error(code + "," + error)
}

/**
 * 对封装的error进行解析
 * @param {*} error
 * @returns
 */
const getError = (error) => {
    let messages = error.message.split(",")
    let rsp = {}
    if (messages.length == 1) {
        rsp.code = 0
        rsp.message = messages[0]
    }

    if (messages.length > 1) {
        rsp.code = parseInt(messages[0])
        rsp.message = messages[1]
    }
    return rsp
}

module.exports = {
    setError,
    getError,
}
