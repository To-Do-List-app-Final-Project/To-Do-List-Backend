const util = require("./util");
const errorCode = require('../errorcodes/index.code');
const errorUtils = require('./errorUtils');
const Joi = require("joi");
const {
    CommonError,
    BadRequestError,
    NotFoundError,
    AuthorizationError,
    ForbiddenError
} = errorUtils;
const idUtils = require('./idUtils');
const {pacsdb: mongoConnection} = require("../models/connection");
const {default: mongoose} = require("mongoose");
const dayjs = require("dayjs")
const log = require('./logUtils').getLogger('fw.serviceUtils')

const isNull = (obj) => {
    if (obj === null || obj === undefined) {
        return true;
    } else {
        return false;
    }
}

const isEmpty = (data) => {
    if (isNull(data)) {
        return true
    }
    if (typeof data == "boolean") {
        return false
    }
    if (typeof data == "string" || typeof data === undefined || typeof data === "undefined") {
        return data === null || data === undefined || data === "" || data === "undefined"
    }

    if (typeof data == "number") {
        return true
    }

    if (typeof data == "number") {
        return true
    }

    if (data instanceof Array) {
        return data.length === 0
    }
    if (data instanceof Date) {
        return false
    }
    return false
}

const valid = (data, validRules) => {
    let schema = validRules;

    let vr = schema.validate(data, {allowUnknown: true});
    if (vr.error && vr.error.details.length > 0) {
        let ds = vr.error.details;
        let errorData = [];
        let errMsg = '';
        for (let i = 0; i < ds.length; i++) {
            errMsg = errMsg ? errMsg + ',' : errMsg;
            errMsg = errMsg + ds[i].message;

            if (ds[i].path) {
                for (let j = 0; j < ds[i].path.length; j++) {
                    errorData.push({path: ds[i].path[j], type: ds[i].type})
                }
            }
        }
        throw new BadRequestError(errorCode.GENERATE_PARAMETERS_ERROR, errMsg, errorData);
    }
}

const cvId2ObjectId = (val) => {
    if (isNull(val)) {
        return null;
    }
    if (typeof val == 'string' && !val) {
        return null;
    }
    try {
        return mongoose.Types.ObjectId(val);
    } catch (error) {
        log.error('参数异常', error);
        throw new BadRequestError(null, `id is error[${val}]`);
    }
}

const cv2bool = (val) => {
    if (isNull(val)) {
        return null;
    }
    if (typeof val == 'boolean') {
        return val;
    } else if (typeof val == 'string') {
        if (!val) {
            return null;
        }
        if (['y', 'true', 't', 'yes', 'Y', 'TRUE'].indexOf(val) >= 0) {
            return true;
        }
        if (['0', 'f', 'false', 'no', 'n', 'c', 'null', 'undefined'].indexOf(val) >= 0) {
            return false;
        }
        return false;
    } else if (typeof val == 'number') {
        return val != 0;
    } else {
        throw Error('obj 2 bool fail.[' + val + ']');
    }
}

/**
 * 转换为日期
 * @param {any} val
 * @param {any} suffix
 * @param {any} timing start end
 * @returns {Date}
 */
const cv2date = (val, suffix, timing) => {
    if (isNull(val)) {
        return null;
    }
    if (typeof val == 'string' && !val) {
        return null;
    }
    if (suffix) {
        val = val + suffix;
    }
    if (timing && timing == "start") {
        return dayjs(val).startOf("day").toDate();
    } else if (timing && timing == "end") {
        return dayjs(val).endOf("day").toDate();
    }
    return dayjs(val).toDate();
}

const cv2array = (val) => {
    if (isNull(val)) {
        return [];
    }
    if (Array.isArray(val)) {
        return val;
    } else {
        return [val];
    }
}

const cv2number = (val) => {
    if (isNull(val)) {
        return null;
    }
    if (typeof val == 'boolean') {
        return val ? 1 : 0;
    }
    return +val;
}

const getId = (val) => {
    if (!val) {
        return null;
    }
    if (val._id) {
        return val._id;
    }
    return null;
}

/**
 * 小于
 * @param {*} val
 * @param {*} field
 * @param {*} query
 * @returns
 */
const dbSetLte = (val, field, query) => {
    if (isNull(val)) {
        return query;
    }
    if (typeof val == 'string' && !val) {
        return query;
    }
    if (query[field]) {
        query[field]['$lte'] = val;
    } else {
        query[field] = [{$lte: val}]
    }
    return query;
}
const dbSetLt = (val, field, query) => {
    if (isNull(val)) {
        return query;
    }
    if (typeof val == 'string' && !val) {
        return query;
    }
    if (query[field]) {
        query[field]['$lt'] = val;
    } else {
        query[field] = [{$lt: val}]
    }
    return query;
}
/**
 * 大于
 * @param {*} val
 * @param {*} field
 * @param {*} query
 * @returns
 */
const dbSetGte = (val, field, query) => {
    if (isNull(val)) {
        return query;
    }
    if (typeof val == 'string' && !val) {
        return query;
    }
    if (query[field]) {
        query[field]['$gte'] = val;
    } else {
        query[field] = {$gte: val}
    }

    return query;
}
const dbSetGt = (val, field, query) => {
    if (isNull(val)) {
        return query;
    }
    if (typeof val == 'string' && !val) {
        return query;
    }
    if (query[field]) {
        query[field]['$gt'] = val;
    } else {
        query[field] = [{$gt: val}]
    }

    return query;
}

const dbSetNe = (val, field, query) => {
    if (isNull(val)) {
        return query;
    }
    if (typeof val == 'string' && !val) {
        return query;
    }
    query[field] = {$ne: val};
    return query;
}

const dbSetEq = (val, field, query) => {
    if (isNull(val)) {
        return query;
    }
    if (typeof val == 'string') {
        if (!val) {
            return query;
        }
    }
    query[field] = val;
    return query;
}
const dbSetLike = (val, field, query) => {
    if (isNull(val)) {
        return query;
    }
    if (typeof val == 'string') {
        if (!val) {
            return query;
        }
    }
    query[field] = {$regex: val, $options: 'i'};
    return query;
}
const dbSetIn = (val, field, query, must = false) => {
    if (isNull(val)) {
        return query;
    }
    if (typeof val == 'string' && !val) {
        return query;
    }
    if (Array.isArray(val)) {
        if (val.length > 0) {
            query[field] = {$in: val}
        } else {
            if (must) {
                query[field] = {$in: val};
            }
        }
    } else {
        query[field] = {$in: [val]}
    }
    return query;
}
const dbPageNo = (no) => {
    if (!no) {
        return 1;
    }
    let ino = +no;
    ino = ino < 1 ? 1 : ino;
    return ino;
}
const dbPageSize = (size) => {
    let max = process.env.PageSize ? process.env.PageSize : 150
    if (!size) {
        return 10;
    }
    let isize = +size;
    isize = isize < 1 ? 1 : isize;
    isize = isize > max ? max : isize;
    return isize;
}

const convertPhoneNumber = (number) => {
    if (typeof number == 'string') {
        let unformat = number.replace(/-/gi, '').replace(/ /gi, '').replace("(", "").replace(")", "").slice(1);
        return unformat;
    }
}

// const dbTransaction = async (cb) => {
//     let session = await mongoConnection.startSession();
//     session.startTransaction();
//     try {
//         await cb(session);
//         session.commitTransaction();
//     } catch (error) {
//         throw error;
//     } finally {
//         session.endSession();
//     }
// }


// baseHelper
const throwErrorWhenEmpty = (obj, code, message, data) => {
    if (isEmpty(obj)) {
        throw new CommonError(code, message, data);
    }
}

// param obj eq true not throw but false will 
const throwErrorWhenFalse = (obj, code, message, data) => {
    if (!obj) {
        throw new CommonError(code, message, data);
    }
}
const throwBadRequestWhenEmpty = (obj, code, message, data) => {
    if (isEmpty(obj)) {
        throw new BadRequestError(code, message, data);
    }
}
/**
 *
 * @param {boolean} obj
 * @param {string|{errorCode:number, status:number, message:string}|null} code
 * @param {string | undefined} message
 * @param {any} data
 */
const throwBadRequestWhenFalse = (obj, code, message, data) => {
    if (!obj) {
        throw new BadRequestError(code, message, data);
    }
}
const throwNotFoundWhenEmpty = (obj, code, message, data) => {
    if (isEmpty(obj)) {
        throw new NotFoundError(code, message, data);
    }
}
const throwNotFoundWhenFalse = (obj, code, message, data) => {
    if (!obj) {
        throw new NotFoundError(code, message, data);
    }
}


module.exports = {
    getTtid: idUtils.getTtid,
    getNumId: idUtils.getNumId,
    getUuid: idUtils.getUuid,

    isNull,
    isEmpty,


    valid,

    throwErrorWhenEmpty,
    throwErrorWhenFalse,
    throwBadRequestWhenEmpty,
    throwBadRequestWhenFalse,
    throwNotFoundWhenEmpty,
    throwNotFoundWhenFalse,

    getId,

    cv2array,
    cv2bool,
    cv2date,
    cv2number,

    convertPhoneNumber,
    cvId2ObjectId,

    dbSetEq,
    dbSetLike,
    dbSetIn,
    dbSetLte,
    dbSetLt,
    dbSetGte,
    dbSetGt,
    dbSetNe,
    // dbTransaction,

    dbPageNo,
    dbPageSize,

    ...errorUtils,
}

