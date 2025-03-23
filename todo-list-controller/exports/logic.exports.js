const util = require("./util")
const Const = require("./const")
const { dayjs } = require("../models/connection")
const path = require("path")
const ErrorCode = require("../errorcodes/index.code")
const xlsx = require("node-xlsx")

/**
 * 读取url地址的excel并读取内容返回
 * @param req
 * @param params
 * @returns {Promise<Error|array>}
 */
const readUrlExcel = async (req) => {
    try {
        let filePath = Const.ProductDir + process.env.TempFilesPath
        let fileName = util.encode(dayjs().toString())
        fileName += "." + util.getFileExtNameOfURL(req.body.url)
        let excelFile = path.join(filePath, fileName)
        let fileExists = await util.downloadFile(req.body.url, filePath, fileName)
        if (fileExists === false) {
            return util.error(ErrorCode.DOWNlOAD_FAILED)
        }

        let rsp = []
        const sheets = xlsx.parse(excelFile)

        // 内容
        for (const k in sheets[0].data) {
            if (sheets[0].data[k].length > 0) {
                rsp.push(sheets[0].data[k])
            }
        }
        return rsp
    } catch (err) {
        return err
    }
}

module.exports = {
    readUrlExcel,
}
