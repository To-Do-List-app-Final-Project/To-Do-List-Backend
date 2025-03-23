const crypto = require("crypto")
const fs = require("fs")
const mongoose = require("mongoose")

const Joi = require("joi")
const download = require("download")
const path = require("path")
const dayjs = require("dayjs")
const literal = require("./literal")
const { dateTimeKeys } = require("../helpers/util.helper")

//加密成sha256
function encode(password) {
    const hash = crypto.createHash("sha256")
    hash.update(password)
    return hash.digest("hex")
}

//数组去重
function unique(array) {
    return Array.from(new Set(array))
}

function removeDuplicates(arr, key) {
    return arr.filter(
        (obj, index, self) =>
            index === self.findIndex((t) => t[key] === obj[key] && JSON.stringify(t) === JSON.stringify(obj))
    )
}
//对数组中按对象某一个属性值进行去重
function uniqueObject(objects, key) {
    let keys = []
    let rsp = []
    if (key.indexOf(".") > 0) {
        return removeDuplicates(objects, key)
    }
    for (const k in objects) {
        if (isEmpty(objects[k][key])) {
            continue
        }
        if (keys.indexOf(objects[k][key]) >= 0) {
            continue
        }
        keys.push(objects[k][key])
        rsp.push(objects[k])
    }
    return rsp
}

function trimAllSpace(str) {
    return String(str).replace(/\s*/g, "")
}

function trim(str) {
    return String(str).replace(/^\s*|\s*$/g, "")
}

/**
 * 删除数组中某一项
 * @param {*} Items
 * @param {*} item
 */
function delItem(Items, item) {
    let rsp = []
    for (let i = 0; i < Items.length; i++) {
        if (String(Items[i]) != String(item)) {
            rsp.push(Items[i])
        }
    }
    return rsp
}

//不为空?
function notEmpty(data) {
    return !isEmpty(data)
}

/**
 * 判断一个变是否为空(默认值也算为空)
 * @param {*} data  string,object,array
 * @returns
 */
//
function isEmpty(data) {
    if (data === null || data === undefined || data === "") {
        return true
    }
    if (typeof data == "boolean") {
        return false
    }

    if (typeof data == "string" || typeof data === undefined || typeof data === "undefined") {
        return data === null || data === undefined || data === "" || data === "undefined"
    }

    if (typeof data == "number" && parseFloat(data) === 0) {
        return true
    }

    if (typeof data == "number" && isNaN(data)) {
        return true
    }

    if(data instanceof mongoose.Types.ObjectId) {
        return false
    }

    if (data instanceof Array) {
        return data.length === 0
    }
    if (data instanceof Date) {
        return false
    }

    if (typeof data == "object") {
        return Object.keys(data).length === 0
    }

    return false
}

/**
 * 验证2维数组每一组的区间是否是升序排列(每一个子项也是升序)
 * 如果不是2维数组蒋返回false
 * @param arr
 * @param operator gte 大于等于  ,  gt 大于
 */
function validationArrayPre(arr, operator = "gte") {
    if (!isArray(arr) || arr.length === 0) {
        return false
    }

    let n
    for (let i = 0; i < arr.length; i++) {
        if (!isArray(arr[i])) {
            return false
        }

        if (i === 0) {
            n = arr[i][0]
        }

        for (let j = 0; j < arr[i].length; j++) {
            if (i === 0 && j === 0) {
                continue
            }

            if (operator === "gte") {
                if (arr[i][j] < n) {
                    return false
                }
            }
            if (operator === "gt") {
                if (arr[i][j] <= n) {
                    return false
                }
            }
            n = arr[i][j]
        }
    }
    return true
}

/**
 * 成功时返回
 * @param {*} req
 * @param {*} res
 * @param {*} data
 * @param {*} message
 */
function ResSuss(req, res, data = {}, message = "Successfully") {
    ReponseSuss(req, res, data, message)
}

//成功时返回
function ReponseSuss(req, res, data = {}, message = "Successfully") {
    data = DataFormat(req, data)
    return res.send({
        status: 200,
        message: message,
        token: req.body.newJwtToken,
        data: data,
        _fw_list: false,
        _fw_consoller: true,
    })
}

/**
 * 返回列表数
 */
function ReponseList(req, res, data, pageSize, pageNo, total, averageTime) {
    return res.send({
        status: 200,
        message: `Successfully`,
        total: total,
        pageSize: pageSize,
        pageNo: pageNo,
        averageTime: averageTime,
        _fw_list: true,
        _fw_consoller: true,
        data: DataFormat(req, data),
    })
}

//数据格式化
function DataFormat(req, data) {
    let dataStr = JSON.stringify(data)
    data = DataFormatZone(req, JSON.parse(dataStr))
    return data
}

function DataFormatAsync(req, data) {
    let dataStr = JSON.stringify(data)
    data = DataFormatZone(req, JSON.parse(dataStr))
    return data
}

//对数据结果:格式化时区
function DataFormatZone(req, data) {
    if (isEmpty(data)) { return data }

    if (data instanceof Array) {
        if (data.length === 0) { return data }

        for (let i = 0; i < data.length; i++) {
            for (k in data[i]) {
                if (isChangeTimeForZone(k, data[i][k])) {
                    data[i][k] = changeTimeByZone(req, data[i][k])
                } else {
                    if (typeof data[i][k] == "object") {
                        data[i][k] = DataFormatZone(req, data[i][k])
                    }
                }
            }
        }
    } else if(typeof data == "object") {
        if (Object.keys(data).length === 0) { return data }

        for (k in data) {
            if (isChangeTimeForZone(k, data[k])) {
                data[k] = changeTimeByZone(req, data[k])
            } else {
                if (typeof data[k] == "object") {
                    data[k] = DataFormatZone(req, data[k])
                }
            }
        }
    } else if((data instanceof Date) || (typeof data === "string")) {
        if(typeof data === "string") {
            const parsed = new Date(data);
            if(!isNaN(parsed.getTime())) {
                data = changeTimeByZone(req, parsed)
            }
        } else {
            data = changeTimeByZone(req, data)
        }
    }

    return data
}

/**
 * 检查一个key和其对应的v，是否需要对值进行时间转换
 * @param {*} k
 * @param {*} v
 * @returns  boolean
 */
function isChangeTimeForZone(k, v) {
    if(dateTimeKeys.indexOf(k) > -1 && String(v).match(/^[\d]{4}\-[\d]{2}\-[\d]{2}/)) {
        return true;
    }
    return false;
}

function dateWithoutTime(date) {
    const dDate = dayjs(date);
    return dDate.hour() === 0 && dDate.minute() === 0 && dDate.second() === 0 && dDate.millisecond() === 0;
}

/**
 * 对时区进行一个时区值的转换，如果没有时区值，则按服务器所在时区转换
 * @param {*} req
 * @param {*} data
 * @returns
 */
function changeTimeByZone(req, data) {
    let format = "MM/DD/YYYY HH:mm:ss"
    let timeZone = req.headers.timezone
    if (isEmpty(timeZone) || dateWithoutTime(data)) {
        return dayjs(data).format(format)
    }
    return dayjs(data).utc().add(parseInt(timeZone), "hour").format(format)
}

/**
 * 失败时返回的状态码和业务码
 * @param {*} req
 * @param {*} res
 * @param {*} rsp  error 或 errorCode 错误码
 * @param {*} data 返回的数据,没有时为空
 * @returns 无
 */
function ResFail(req, res, rsp, data = null) {
    let response = {}

    //如果是错误时的处理
    if (isError(rsp)) {
        response.message = rsp.message
        response.status = 400 //默认
        response.errorCode = 100000 //默认
        //如果消息是错误信息时的处理
        try {
            let tempObj = JSON.parse(rsp.message)
            if (tempObj instanceof Object && tempObj.errorCode > 0) {
                response.status = tempObj.status
                response.errorCode = tempObj.errorCode
                response.message = tempObj.message
                if(notEmpty(tempObj.data)) {
                    response.data = tempObj.data
                }
            }
        } catch (error) { }
    } else {
        if (isString(rsp)) {
            response.message = rsp
            response.status = 400 //默认
            response.errorCode = 100000 //默认
        } else {
            //如果是errCode错误对象时的处理
            response.status = rsp.status
            response.errorCode = rsp.errorCode
            response.message = rsp.message

            if (notEmpty(rsp?.errorData)) {
                response.data = rsp.errorData
            }
        }
    }

    if (notEmpty(data)) {
        response.data = DataFormat(req, data);
    }
    return res.send(response)
}

//失败时返回,尽量用方法:ResFail()
function ReponseFail(req, res, status, message, data) {
    if (isEmpty(data)) {
        return res.send({ status: status, message: message })
    }
    return res.send({ status: status, message: message, data: DataFormat(req, data) })
}

/**
 * 获取当前时间的字符串格式:2022-08-11 15:11:12
 * @returns string
 */
function getTimeNow() {
    return dayjs().format("MM/DD/YYYY HH:mm:ss.SSS")
}

/**`
 * 获取今天的开始时间的:2022-08-22 00:00:00
 * @returns string
 */
function getToday() {
    return dayjs().startOf("D").format("MM/DD/YYYY HH:mm:ss")
}

/**`
 * Get date's start time: 2022-08-22 00:00:00
 * @param {*} date 
 * @returns string
 */
function getDateStart(date) {
    return dayjs(date).startOf("D").format("MM/DD/YYYY HH:mm:ss")
}

/**`
 * Get date's start time: 2022-08-22 00:00:00
 * @param {*} date 
 * @returns string
 */
function getDateEnd(date) {
    return dayjs(date).endOf("D").format("MM/DD/YYYY HH:mm:ss")
}

/**
 * 把url还原成为路由的URL形式( path中的变量,只能是:id 这样的形式)
 * @param {string} url
 * @returns {string}
 */
function paseUrlPath(url) {
    return url.replace(/[a-z0-9]{24}/, ":id")
}

function getRoutePath(req) {
    let path = req.baseUrl + req._parsedUrl.pathname
    return paseUrlPath(path)
}

/**
 * 对pageSize进行值规范化
 * @param {int} pageSize
 * @returns {int}
 */
function defaultPageSize(pageSize) {
    let max = process.env.PageSize ? process.env.PageSize : 150
    max = parseInt(max)
    pageSize = parseInt(pageSize)
    if (isEmpty(pageSize)) {
        return max
    }

    return pageSize > max || pageSize < 1 ? max : pageSize
}

/**
 * 对pageNo进行值规范化
 * @param {int} pageSize
 * @returns {int}
 */
function defaultPageNo(pageNo) {
    if (isEmpty(pageNo)) {
        return 1
    }
    pageNo = parseInt(pageNo)
    return pageNo < 1 ? 1 : pageNo
}

function defaultSort(sort) {
    if (isEmpty(sort) || parseInt(sort) != 1) {
        sort = -1
    } else {
        sort = 1
    }
    return sort
}

function createRouteToJson(qz, routes) {
    let routeJsons = []
    routes.forEach((route) => {
        for (x in route.route.stack) {
            let temp = route.route.stack[x].route
            let path = "/" + qz + route.path + temp.path
            path = deleteTailStr(path, "/")
            routeJsons.push([path, temp.stack[0].method, ""])
        }
    })

    fs.writeFile("./logs/Routes_" + qz + ".json", JSON.stringify(routeJsons), function (err) {
        console.info("失败", err)
    })
    console.info("done!")
}

/**
 * 获取当前登陆用户的类型
 * @param {*} loginUser
 * @return employee|staff
 */
function getTypeLoginUser(loginUser) {
    return loginUser.siteId != "" ? "employee" : "staff"
}

/**
 * 从一个列表对像中按key名获取相应的value，返回组成的数组.
 *
 * let lists=[
 {
    name:"张三",
    age:20
    },
 {
    name:"李四",
    age:21
    }
 ];
 console.info(getItemsOfList(lists,"name"))
 * @param {[]} lists
 * @param {string} itemName
 * @returns []
 */
function getItemsOfList(lists, itemName, type = "") {
    let items = []
    lists.forEach((v) => {
        if(notEmpty(v[itemName])) {
            if (type == "ObjectId") {
                items.push(objectId(v[itemName]))
            } else {
                items.push(v[itemName])
            }
        }
    })
    return items
}

/**
 * 按下标获取列表中的对象为数组
 * @param list
 * @param index
 * @returns {*[]}
 */
function getArrayOfListByIndex(list, index) {
    let rsp = []
    for (const k in list) {
        let temp = {}
        if (isArray(list[k])) {
            temp = list[k][index]
        } else {
            temp = list[k][index]
        }

        rsp.push(temp)
    }
    return rsp
}

/**
 * 通过列表中的某个子对象的属性名和值，返回这个对象
 * @param list
 * @param itemName
 * @param value
 * @returns {*|null}
 */
function getItemByOfListByNameValueString(list, itemName, value) {
    for (const k in list) {
        if (String(list[k][itemName]) === String(value)) {
            return list[k]
        }
    }
    return null
}

/**
 * 通过节点名和值，返回对应的一个对象
 * @param lists
 * @param itemName
 * @param value
 * @returns {*|null}
 */
function getItemOfList(lists, itemName, value) {
    for (const k in lists) {
        if (lists[k][itemName] === value) {
            return lists[k]
        }
    }
    return null
}

function isError(v) {
    return v instanceof Error && typeof v.message !== "undefined"
}

function isNumber(v) {
    return typeof v === "number" && isFinite(v)
}

//是否是数字型字符串
function isNumic(v) {
    return !isNaN(Number(v))
}

function isString(v) {
    return typeof v === "string"
}

//返回一个Error
function newError(v) {
    if (isString(v)) {
        return new Error(v)
    }
    return new Error(JSON.stringify(v))
}

/**
 * 校验query参数的值
 await util.verifyQuery(req, res, [
    ["equipmentId", Joi.string().min(6).error(new Error("Equipment Id length must be gt 6 "))]
  ], next)
 * @param {*} req 
 * @param {*} res 
 * @param {*} dataList
 * @param {*} next 
 * @returns
 */
const verifyQuery = async (req, res, dataList, next) => {
    try {
        let tempObj = {}
        let targetData = {}
        for (let i = 0; i < dataList.length; i++) {
            tempObj[dataList[i][0]] = dataList[i][1]
            let schema = Joi.object(tempObj)
            targetData[dataList[i][0]] = req.query[dataList[i][0]]
            await schema.validateAsync(targetData)
        }
        next()
    } catch (err) {
        return ReponseFail(req, res, 400, err.message)
    }
}

/**
 * 对尺寸大小进行转换，
 * @param size
 * @returns {number}  bytes
 */
const sizeToInt = function (size) {
    size = String(size).toLowerCase()
    if (size.match(/(mb)$/)) {
        return parseInt(size.split("mb")[0]) * 1024 * 1024
    }
    if (size.match(/(m)$/)) {
        return parseInt(size.split("m")[0]) * 1024 * 1024
    }
    if (size.match(/(kb)$/)) {
        return parseInt(size.split("kb")[0]) * 1024
    }
    if (size.match(/(k)$/)) {
        return parseInt(size.split("k")[0]) * 1024
    }
    return parseInt(size)
}

const splitPathToData = function (data, path) {
    try {
        let rsp = path.split(".")
        switch (rsp.length) {
            case 1:
                return data[rsp[0]]
            case 2:
                return data[rsp[0]][rsp[1]]
            case 3:
                return data[rsp[0]][rsp[1]][rsp[2]]
            case 4:
                return data[rsp[0]][rsp[1]][rsp[2]][rsp[3]]
            case 5:
                return data[rsp[0]][rsp[1]][rsp[2]][rsp[3]][rsp[4]]
            case 6:
                return data[rsp[0]][rsp[1]][rsp[2]][rsp[3]][rsp[4]][rsp[5]]
            case 7:
                return data[rsp[0]][rsp[1]][rsp[2]][rsp[3]][rsp[4]][rsp[5]][rsp[6]]
        }
        return undefined
    } catch (error) {
        return undefined
    }
}

/**
 * 校验body参数的值
 await util.verifyBody(req, res, [
 ["equipmentId", Joi.string().min(6).error(new Error("Equipment Id length must be gt 6 "))]
 ], next)

 * @param {*} req
 * @param {*} res
 * @param {*} dataList
 * @param {*} next
 * @param callback  增加的回调,以扩展功能
 * @returns
 */
const verifyBody = async (req, res, dataList, next) => {
    try {
        let tempObj = {}
        let targetData = {}
        for (let i = 0; i < dataList.length; i++) {
            tempObj[dataList[i][0]] = dataList[i][1]
            let schema = Joi.object(tempObj)
            targetData[dataList[i][0]] = splitPathToData(req.body, dataList[i][0])
            await schema.validateAsync(targetData)
        }

        next()
    } catch (err) {
        return ResFail(req, res, err)
    }
}

const verifyObj = async (req, res, method, schema, next) => {
    try {
        let data = {}
        if (method === "get") {
            data = req.query
        } else {
            data = req.body
        }
        let rsp = await schema.validateAsync(data)
        if (rsp) {
        }
        next()
    } catch (err) {
        return ResFail(req, res, err)
    }
}

/**
 * 校验参数
 *
 * 尽量使用: verifyQuery 或 verifyBody
 * @param {*} req
 * @param {*} res
 * @param {*} data
 * @param {*} schema
 * @param {*} next
 * @returns
 */
const verify = async (req, res, data, schema, next) => {
    try {
        await schema.validateAsync(data)
        next()
    } catch (err) {
        return ReponseFail(req, res, 400, err.message)
    }
}

const unwind = (path) => {
    return {
        $unwind: {
            path: "$" + path,
            preserveNullAndEmptyArrays: true,
        },
    }
}

const objectId = (id) => {
    if(notEmpty(id)) {
        return mongoose.Types.ObjectId(id)
    }
    return null
}

const newObjectId = () => {
    return mongoose.Types.ObjectId()
}


const firstLetterCapital = (text) => {
    const getConvertedText = (text) => {
        const firstLetter = text.charAt(0).toUpperCase();
        const str = text.substring(1);
        return firstLetter + str;
    }
    
    const arrStr = text.split(' ');
    let newStr = getConvertedText(arrStr[0]);
    for (let i = 1; i < arrStr.length; i++) {
        newStr += " " + getConvertedText(arrStr[i]);
    }
    return newStr;
}

const lookupOnePipeline = (from, localField, foreignField, as, pipeline) => {
    return [
        {
            $lookup: {
                from: from,
                localField: localField,
                foreignField: foreignField,
                pipeline: pipeline,
                as: as
            },
        },
        {
            $unwind: {
                path: "$" + as,
                preserveNullAndEmptyArrays: true,
            },
        },
    ]
}

const lookupManyPipeline = (from, localField, foreignField, as, pipeline, letVars = undefined) => {
    const lookupStage = {
        $lookup: {
            from: from,
            localField: localField,
            foreignField: foreignField,
            pipeline: pipeline,
            as: as,
        },
    };

    if (notEmpty(letVars)) {
        lookupStage.$lookup.let = letVars;
    }

    return [lookupStage];
}

const bulkUpdateOne = (filter, update) => {
    return {
        updateOne: {
            filter: filter,
            update: update
        }
    };
}


const bulkUpdateMany = (filter, update) => {
    return {
        updateMany: {
            filter: filter,
            update: update
        }
    };
}

const mapArray = (key, as, returnValue) => {
    return {
        $map: {
            input: `$${key}`,
            as: as,
            in: returnValue,
        },
    };
}

const lookupOne = (from, localField, foreignField, as) => {
    return [
        {
            $lookup: {
                from: from,
                localField: localField,
                foreignField: foreignField,
                as: as,
            },
        },
        {
            $unwind: {
                path: "$" + as,
                preserveNullAndEmptyArrays: true,
            },
        },
    ]
}

/**
 * Sort for Aggregate
 * 
 * @param { Array<{ case: { any }, then: number }> } branches
 */
const sortingByBranches = (branches) => {
    return  [{
        $addFields: {
            order: {
                $switch: {
                    branches: branches,
                    default: branches.length + 1
                }
            }
        }
    },
    {
        $sort: { order: 1 }
    }];
}

const lookupMany = (from, localField, foreignField, as) => {
    return [
        {
            $lookup: {
                from: from,
                localField: localField,
                foreignField: foreignField,
                as: as,
            },
        },
    ]
}

const toUpperFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

const toLowerFirst = (str) => {
    return str.charAt(0).toLowerCase() + str.slice(1)
}

let idcount=0
//返回11位随机数字,基于毫秒，再随机两位(不重复)
const rand11Number = () => {
    // let timeStr = dayjs().format("YYMMDDHHmm.ssSSS")
    // let timeStrList = timeStr.split(".")

    // //随机两位
    // let tail = randomRange(100, 999)
    // let rsp = parseInt(timeStrList[0]) + parseInt(timeStrList[1]) + tail

    // return String(rsp) + String(randomRange(0, 9))

    let tlong = new Date().getTime() - 1577808000000;
    let left = Math.floor(tlong / 1000);
    let right = tlong % 1000;
    let tail = randomRange(0, 99999999);

    let r = (left % 1000000 + right + tail) % 100000000;
    let num = '' + Math.floor(left / 1000000) + r;
    return ('0000000' + num).slice(-11);
}
//返回9位随机数字,基于毫秒，再随机三位(不重复)
const rand9Number = () => {
    // let timeStr = dayjs().format("YYMMDDHH.mmssSSS")
    // let timeStrList = timeStr.split(".")
    // //随机三位
    // let tail = randomRange(100, 999)
    // let rsp = parseInt(timeStrList[0]) + parseInt(timeStrList[1]) + tail
    // return String(rsp) + String(randomRange(0, 9))

    let tlong = new Date().getTime() - 1577808000000;
    let left = Math.floor(tlong / 1000);
    let right = tlong % 1000;
    let tail = randomRange(0, 999999);

    let r = (left % 1000000 + right + tail) % 1000000;
    let num = '' + Math.floor(left / 1000000) + r;

    // let tlong = new Date().getTime() - 1577808000000;
    // let left = Math.floor(tlong / 1000);
    // let right = tlong % 1000;
    // // let tail = randomRange(0, 99999);

    // let r = (left % 100000 + right + tail) % 100000;
    // let num = '' + Math.floor(left / 100000) + r;
    return ('0000000' + num).slice(-9);
}
//返回10位随机数字,基于毫秒，再随机三位(不重复)
const rand10Number = () => {
    let tlong = new Date().getTime() - 1577808000000; 
    let left = Math.floor(tlong / 1000);
    let right = tlong % 1000;
    let tail = randomRange(0, 9999999);

    let r = (left % 1000000 + right + tail) % 10000000;
    let num = '' + Math.floor(left / 1000000) + r;

    // let timeStr = dayjs().format("YYMMDDHH.mmssSSS")
    // let timeStrs = timeStr.split(".")
    // //随机三位
    // let tail = randomRange(100, 999)
    // let rsp = parseInt(timeStrs[0] * 10) + parseInt(timeStrs[1]) + tail
    // return String(rsp) + String(randomRange(0, 9))
    return ('0000000' + num).slice(-10);
}

function randomRange(min, max) {
    // min最小值，max最大值
    return Math.floor(Math.random() * (max - min)) + min
}

/**
 * 名字脱敏 保留首位
 * @param fullName
 * @returns {string}
 */
function hideStrName(fullName) {
    if (!fullName) {
        return ""
    }

    let str = fullName.substr(0, 1)
    for (let i = 0; i < fullName.length - 1; i++) {
        str += "*"
    }

    return str
}

/**
 * 脱敏公用
 * @param str 脱敏字符串
 * @param begin 起始保留长度，从0开始
 * @param end 结束保留长度，到str.length结束
 * @returns {string}
 */
function hideStrCommon(str, begin, end) {
    if (!str && begin + end >= str.length) {
        return ""
    }

    let leftStr = str.substring(0, begin)
    let rightStr = str.substring(str.length - end, str.length)

    let strCon = ""
    for (let i = 0; i < str.length - end - begin; i++) {
        strCon += "*"
    }
    return leftStr + strCon + rightStr
}

/**
 * 手机号脱敏
 * @param str
 * @returns {string|*|string}
 */
function hideStrPhone(str) {
    if (!str) {
        return ""
    }
    //   格式待定
    let HideStrPhoneReg = /^([\d]{4})([\d]{4})([\d]{1,})$/
    return str.replace(HideStrPhoneReg, "$1****$2")
}

/**
 * 身份证号脱敏
 * @param str
 * @returns {string|*|string}
 */
function hideStrIdNo(str) {
    if (!str) {
        return ""
    }

    //   证件号格式待定
    let HideStrIdNoReg = /([\w]{4})([\w]{4})([\w]{1,})/
    if (HideStrIdNoReg.test(str)) {
        let text1 = RegExp.$1
        let text3 = RegExp.$3
        let text2 = RegExp.$2.replace(/./g, "*")
        return text1 + text2 + text3
    }
    return str
}

/**
 * 地址脱敏
 * @param str
 * @returns {string|*|string}
 */
function hideStrAddr(str) {
    if (!str) {
        return ""
    }
    let HideAddrReg = /(.{9})(.*)/ // 地址正则
    if (HideAddrReg.test(str)) {
        let text1 = RegExp.$1
        let text2 = RegExp.$2.replace(/./g, "*")
        if (text2.length > 7) {
            text2 = "*".repeat(7)
        }
        return text1 + text2
    }
    return str
}

function hideStrEmail(str) {
    if (!str) {
        return ""
    }
    let HideAddrReg = /([\w\-\.]+)([\w\-\.]{4})@(.*)/
    if (HideAddrReg.test(str)) {
        let text1 = RegExp.$1
        let text3 = RegExp.$3
        let text2 = RegExp.$2.replace(/./g, "*")
        return text1 + text2 + text3
    }
    return str
}

/**
 * 脱敏最后几位
 * @param {*} str
 * @param {*} length
 * @returns
 */
function hideStrTail(str, length) {
    str = String(str)
    if (!str) {
        return ""
    }
    if (str.length < length) {
        return "*".repeat(str.length)
    }

    let leftStr = str.substring(0, str.length - length)
    return leftStr + "*".repeat(length)
}

/**
 * 保留最后几位,前面部份进行脱敏
 * @param {*} str
 * @param {*} length
 * @returns
 */
function hideStrtopTail(str, length) {
    str = String(str)
    if (!str) {
        return ""
    }
    if (str.length < length) {
        return "*".repeat(str.length)
    }

    let rightStr = str.substring(str.length - length, str.length)
    return "*".repeat(str.length - length) + rightStr
}

/**
 * 脱敏前几位
 * @param {*} str
 * @param {*} length
 * @returns
 */
function hideStrTop(str, length) {
    str = String(str)
    if (!str) {
        return ""
    }
    if (str.length < length) {
        return "*".repeat(str.length)
    }

    let rightStr = str.substring(length, str.length)
    return "*".repeat(length) + rightStr
}

//删除尾部特特定的字符串
function deleteTailStr(str, tailStr) {
    return str.split("").reverse().join("").replace(tailStr, "").split("").reverse().join("")
}

/**
 *  对某个字段进行时间的查询，这里查这一天内的范围
 * @param {*} filename
 * @param {string} timeStr
 * @returns {Ojbect}
 */
function getQueryOneDayTime(query, filename, timeStr) {
    if (isEmpty(timeStr)) {
        return query
    }

    // return query
    let start = dayjs(timeStr).startOf("day").toDate()
    let end = dayjs(timeStr).add(1, "day").startOf("day").toDate()
    query[filename] = {
        $gte: start,
        $lt: end,
    }

    return query
}

/**
 *  对某个字段进行时间的查询，这里查当天内的范围
 * @param {*} filename
 * @param {string} timeStr
 * @returns {Ojbect}
 */
function getQueryToDayTime(query, filename) {
    // return query
    let start = dayjs().startOf("day").toDate()
    let end = dayjs().add(1, "day").startOf("day").toDate()
    query[filename] = {
        $gte: start,
        $lt: end,
    }

    return query
}

/**
 * 对天数值转化成秒数，低于1秒为1秒,小于等于0时为0
 * @param {number} num
 */
function dayToSeconds(num) {
    let rsp = num * 86400
    return rsp > 0 ? rsp : 1
}

function queryNotEmptyEq(query, key, value) {
    if (notEmpty(value)) {
        query[key] = value
    }
    return query
}

/**
 * 通过获取一个path，获取对应的值
 * @param {*} entity 对像的实例
 * @param {any} path  多级用"."号分隔
 */
function getValueByPath(entity, path) {
    return path.split(".").reduce((p, c) => {
        return p && p[c] ? p[c] : null
    }, entity)
}

/**
 * mongoose数据记录对象转JSON对象
 * @param {*} object
 * @returns
 */
function objectToJson(object) {
    if (isEmpty(object)) {
        return object
    }
    return JSON.parse(JSON.stringify(object))
}

function titleCase(str) {
    str = String(str)
    if (str.length <= 1) {
        return str.toUpperCase()
    }
    return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase()
}

function getQueryBetweenTime(query, startDate, endDate, filename) {
    let start = dayjs(startDate).toDate()
    let end = dayjs(endDate).toDate()
    if (isEmpty(startDate) && isEmpty(endDate)) {
        return query
    }

    if (notEmpty(startDate) && isEmpty(endDate)) {
        query[filename] = { $gte: start }
        return query
    }

    if (isEmpty(startDate) && notEmpty(endDate)) {
        query[filename] = { $lt: endDate }
        return query
    }

    query[filename] = {
        $gte: start,
        $lt: end,
    }

    return query
}

function getQueryBetweenDate(query, startDate, endDate, filename) {
    let start = dayjs(startDate).startOf("day").toDate()
    let end = dayjs(endDate).endOf("day").toDate()
    if (isEmpty(startDate) && isEmpty(endDate)) {
        return query
    }

    if (notEmpty(startDate) && isEmpty(endDate)) {
        query[filename] = { $gte: start }
        return query
    }

    if (isEmpty(startDate) && notEmpty(endDate)) {
        query[filename] = { $lt: end }
        return query
    }

    query[filename] = {
        $gte: start,
        $lt: end,
    }

    return query
}

function getObjectId(data, filename) {
    let query = {};
    if (notEmpty(data)) {
        query[filename] = mongoose.Types.ObjectId(data)
        return query
    }

    return query
}

/**
 * 所有单词的首字母都大写
 * @param str
 * @returns {string}
 */
function titleCases(str) {
    let arr = String(str).split(" ")
    for (let i = 0; i < arr.length; i++) {
        arr[i] = titleCase(arr[i])
    }
    return arr.join(" ")
}

function isArray(v) {
    // return v instanceof Array
    return Array.isArray(v)
}

//对参数中的数组进行格式化
function urlParamArrayFormat(v) {
    if (!isArray(v)) {
        return v
    }

    for (let i = 0; i < v.length; i++) {
        if (v[i] === "null") {
            v[i] = null
        }
    }
    return v
}

/**
 * 对文件url进行文件名的获取
 * @param url   文件地址(url)
 * @returns {any}  如果没有获取到返回 null,  成功获取到返回:文件名的字符串
 */
function getFileNameOfURL(url) {
    if (url === "") {
        return null
    }
    let urls = url.split("?")
    let fileName = urls[0].split("/")

    let file = fileName[fileName.length - 1]
    if (file.match(/\.(jpg|jpeg|png|gif|xls|xlsx|doc|docx|mp4)$/i)) {
        return file
    } else {
        return ""
    }
}

/**
 * 对文件url进行文件名的获取
 * @param url   文件地址(url)
 * @returns {any}  如果没有获取到返回 null,  成功获取到返回:文件名的字符串
 */
function getFileExtNameOfURL(url) {
    try {
        if (url === "") {
            return ""
        }
        let urls = url.split("?")
        let fileName = urls[0].split("/")
        let tempFile = fileName[fileName.length - 1]
        let tempFiles = tempFile.split(".")
        let ext = tempFiles[tempFiles.length - 1]
        if (ext.match(/^(jpg|jpeg|png|gif|xls|xlsx|doc|docx|mp4)$/i)) {
            return ext
        } else {
            return ""
        }
    } catch (e) {
        return ""
    }
}

/**
 * 检查文件是否存在(只能检查项目内文件?)
 * @param file
 * @returns {Promise<boolean>}
 */
function checkFileExists(file) {
    return fs.promises
        .access(file, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)
}

/**
 * 创建多层目录
 * @param dirname
 * @returns {boolean}
 */
function mkdirSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true
    } else {
        if (mkdirSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname)
            return true
        }
    }
}

/**
 * 下载指定的url文件,并保存为指定的文件
 * @param uri
 * @param filename
 * @returns {Promise<boolean>}
 */
const downloadFile = async (url, path, filename) => {
    try {
        // path 是否存在，不存在的话，需要创建目录
        let dirState = mkdirSync(path)
        await download(url, path, { filename: filename })
        return true
    } catch (e) {
        return false
    }
}

//返回一个error对象
const error = (message, data = null) => {
    if (isString(message)) {
        return new Error(message)
    }

    if (isError(message)) {
        return message
    }
    if (notEmpty(data)) {
        message.data = data
    }
    return new Error(JSON.stringify(message))
}
/**
 * 把查询的内容都转义
 * @param str
 * @returns {Promise<String>}
 */
const regRaw = async (str) => {
    let reg = ["/", "(", ")", "{", "}", ".", "$", "#", "&"]
    for (let i = 0; i < reg.length; i++) {
        str = str.replace(reg[i], "\\" + reg[i])
    }
    return str
}

const dateFormat = async (date) => {
    return date.slice(6) + "-" + date.slice(0, 2) + "-" + date.slice(3, 5)
}
/**
 * sorting priority in donor notes, reactions
 * @param {*} a
 * @param {*} b
 * @returns {int}
 */
const prioritySort = (a, b) => {
    let aIndex = a?.isDeleted ? 3 : literal.NR_PRIORITY.indexOf(a?.priority?.toLowerCase());
    let bIndex = b?.isDeleted ? 3 : literal.NR_PRIORITY.indexOf(b?.priority?.toLowerCase());
    return aIndex - bIndex;
}

const getFullName = (user) => {
    let fullname = '';
    if (notEmpty(user)) {
        if (notEmpty(user.middleName)) {
            fullname = `${user.firstName} ${user.middleName} ${user.lastName}`
        } else {
            fullname = `${user.firstName} ${user.lastName}`
        }
    }
    return fullname
}

/**
 * changeArrayHasDuplicates
 * @param arr
 * @returns {Promise<boolean>}
 */
const hasDuplicates = arr => arr.length !== new Set(arr).size;

const emptyToNull = (data) => {
    if(isEmpty(data)) return null
    return data;
}

/**
 * increase 1 if fractional part is greater than 0
 * @param {*} num 
 * @returns 
 */
function frlGtZero(num) {
    const frl = num - Math.floor(num);
    if (frl > 0) { return Math.floor(num) + 1; }
    return  Math.floor(num);
}

function getQueryRangeNumb(query, numStart, numEnd, filename) {
    if (isEmpty(numStart) && isEmpty(numEnd)) {
        return query
    }

    if (notEmpty(numStart) && isEmpty(numEnd)) {
        query[filename] = { $gte: numStart }
        return query
    }

    if (isEmpty(numStart) && notEmpty(numEnd)) {
        query[filename] = { $lt: numEnd }
        return query
    }

    query[filename] = { $gte: numStart, $lte: numEnd }

    return query
}

function removeNestedEmpty(obj) {
    for (const key in obj) {
        if (isEmpty(obj[key])) {
            delete obj[key];
        } else if (typeof obj[key] === "object") {
            removeNestedEmpty(obj[key]);
        }
    }
}

const uniqueByKey = (array, key) => {
    const seen = new Set();
    return array.filter(item => {
        const keyValue = item[key];
        if (seen.has(keyValue)) {
            return false;
        } else {
            seen.add(keyValue);
            return true;
        }
    });
}

const uniqueByNestedKey = (array, key) => {
    const seen = new Set();
    return array.filter(item => {
        key.forEach(k => {
            item = item[k];
        });
        let keyValue = String(item);
        if (seen.has(keyValue)) {
            return false;
        } else {
            seen.add(keyValue);
            return true;
        }
    });
}

const compareStr = (str1, str2) => {
    return String(str1).toLocaleLowerCase() === String(str2).toLocaleLowerCase()
}

const arrStrEqualsCheck = (a, b) => {
    a.sort(); b.sort();
    return a.length === b.length && a.every((v, i) => String(v) === String(b[i]))
}

const arrStrContainAllOfA = (a, b) => {
    return a.every(val => b.includes(val))
}

/**
 * Data AM/PM with Timezone
 * 
 * @param {*} req
 * @param {*} data
 * @returns
 */
function dateTimeByZone(req, data) {
    if(isEmpty(data)) { return data }
    const format = "MM/DD/YYYY hh:mm A"
    const timeZone = req.headers.timezone
    if (isEmpty(timeZone) || dateWithoutTime(data)) {
        return dayjs(data).format(format)
    }
    return dayjs(data).utc().add(parseInt(timeZone), "hour").format(format)
}

const validateArrayObject = (arr) => {
    let message = "";
    if (!isArray(arr) || arr.length === 0) {
        return false
    }

    for (let i = 0; i < arr.length; i++) {
        let key = Object.keys(arr[i]);
        if(isEmpty(arr[i][key])) {
            message = `${key} should not be empty`;
        }
    }
    return message
}

const validateArrayValue = (arr) => {
    let isError = false;
    if (!isArray(arr) || arr.length === 0) {
        return false
    }

    for (let value of arr) {
        if (isEmpty(value)) {
            isError = true
        } else {
            isError = false
        }
    }
    return isError
}

const verifyShelfLife = async (acquisitionTime, expirationTime, shelfLifeMonths) => {
    let checkShelfLife = true;
    const daysDiff = dayjs(expirationTime).diff(acquisitionTime, "month");

    if (parseInt(shelfLifeMonths) !== parseInt(daysDiff)) {
        checkShelfLife = false
    }
    return { checkShelfLife, daysDiff }
}

// Function to get the UTC offset for a specific timezone
function getOffsetForTimeZone(timeZone) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(part => part.type === 'timeZoneName')?.value;
    const match = offsetPart?.match(/GMT([+-]\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

// Function to find timezone names that match a given UTC offset
function getTimeZonesByOffset(targetOffset) {
    const timeZones = Intl.supportedValuesOf('timeZone'); // List of all timezones supported
    const matchedTimeZones = [];

    timeZones.forEach(timeZone => {
        const offset = getOffsetForTimeZone(timeZone);
        if (offset === targetOffset) {
            matchedTimeZones.push(timeZone);
        }
    });

    return matchedTimeZones.length
        ? matchedTimeZones
        : "";
}


// Function to find the first timezone name that matches a given UTC offset
function getSingleTimeZoneByOffset(targetOffset) {
    const timeZones = Intl.supportedValuesOf('timeZone'); // List of all timezones supported

    for (const timeZone of timeZones) {
        const offset = getOffsetForTimeZone(timeZone);
        if (offset === targetOffset) {
            return timeZone; // Return the first matching timezone
        }
    }

    return "";
}

function calculateAge(birthDate) {
    const birthDateObj = new Date(birthDate);
    const currentDate = new Date();

    let age = currentDate.getFullYear() - birthDateObj.getFullYear();
    const monthDifference = currentDate.getMonth() - birthDateObj.getMonth();

    // If the birthdate hasn't occurred yet this year, subtract one from the age
    if (monthDifference < 0 || (monthDifference === 0 && currentDate.getDate() < birthDateObj.getDate())) {
        age--;
    }

    return age;
}

const getIntFromString = (fieldName, key) => [
    {
        $addFields: {
            [fieldName]: {
                $toInt: {
                    $ifNull: [{
                        $getField: {
                            field: "match",
                            input: {
                                $regexFind: { input: `$${key}`, regex: /\d+$/ }
                            }
                        }
                    },
                        0]
                }
            }
        }
    }
]

const generateRandomUniqueNumber = (id) => {
    const timestamp = Date.now();
    // Generate a random number (between 100000 and 999999) for uniqueness
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    // Combine ID, timestamp, and random number
    const dataToHash = `${id}${timestamp}${randomNumber}`;
    // Generate a hash using SHA-256
    const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");
    // Take the last 6 characters from the hash and convert to a number
    const uniqueNumber = parseInt(hash.substring(hash.length - 6), 16) % 1000000;

    return uniqueNumber;
}

const sortByKeys = (keys, _default) => {
    let sorts = {}
    if(notEmpty(keys)) {
        Object.entries(keys).map(([key, value]) => {
            if(["asc", "desc"].includes(value)) {
                sorts[key] = value === "asc" ? 1 : -1
            }
        });
    } else { sorts = { ..._default }}

    return sorts;
}

const ignoreNull = (key) => ({
    $first: {
        $arrayElemAt: [
            {
                $filter: {
                    input: [`$${key}`],
                    as: "item",
                    cond: { $ne: ["$$item", null] }
                }
            },
            0
        ]
    }
})

module.exports = {
    isArray,
    error,
    getItemByOfListByNameValueString,
    getFileNameOfURL,
    downloadFile,
    getFileExtNameOfURL,
    titleCases,
    titleCase,
    objectToJson,
    urlParamArrayFormat,
    getTypeLoginUser,
    hideStrAddr,
    hideStrIdNo,
    hideStrPhone,
    hideStrCommon,
    hideStrEmail,
    hideStrName,
    hideStrTail,
    hideStrTop,
    hideStrtopTail,
    rand11Number,
    rand9Number,
    randomRange,
    verify,
    unwind,
    lookupMany,
    toUpperFirst,
    toLowerFirst,
    lookupOne,
    lookupOnePipeline,
    lookupManyPipeline,
    getToday,
    getDateStart,
    getDateEnd,
    getTimeNow,
    getItemsOfList,
    getItemOfList,
    encode,
    isEmpty,
    ReponseSuss,
    ReponseFail,
    paseUrlPath,
    ReponseList,
    defaultPageSize,
    defaultPageNo,
    createRouteToJson,
    defaultSort,
    notEmpty,
    isError,
    isNumber,
    isNumic,
    objectId,
    newObjectId,
    getQueryOneDayTime,
    unique,
    getRoutePath,
    deleteTailStr,
    dayToSeconds,
    getQueryToDayTime,
    delItem,
    verifyBody,
    verifyQuery,
    getValueByPath,
    queryNotEmptyEq,
    rand10Number,
    ResFail,
    ResSuss,
    newError,
    isString,
    splitPathToData,
    validationArrayPre,
    sizeToInt,
    getArrayOfListByIndex,
    checkFileExists,
    verifyObj,
    trimAllSpace,
    trim,
    regRaw,
    dateFormat,
    getQueryBetweenDate,
    uniqueObject,
    removeDuplicates,
    getQueryBetweenTime,
    prioritySort,
    getObjectId,
    getFullName,
    hasDuplicates,
    emptyToNull,
    frlGtZero,
    getQueryRangeNumb,
    removeNestedEmpty,
    uniqueByKey,
    uniqueByNestedKey,
    compareStr,
    arrStrEqualsCheck,
    dateTimeByZone,
    DataFormatAsync,
    validateArrayValue,
    validateArrayObject,
    arrStrEqualsCheck,
    verifyShelfLife,
    arrStrContainAllOfA,
    bulkUpdateMany,
    bulkUpdateOne,
    sortingByBranches,
    mapArray,
    firstLetterCapital,
    getTimeZonesByOffset,
    getSingleTimeZoneByOffset,
    calculateAge,
    getIntFromString,
    generateRandomUniqueNumber,
    sortByKeys,
    ignoreNull
}
