const { UNAUTHORIZED, BAD_REQUEST, FORBIDDEN, SERVER, NOT_FOUND } = require("../errorcodes/index.code");
const util = require("./util")
const log = require('./logUtils').getLogger('fw.operation')
const contextUtils = require('./contextUtils')
const idUtils = require('./idUtils');
const dayjs = require("dayjs");
const Joi = require("joi");
const serviceUtils = require('./serviceUtils')
const fieldUtils = require('./fieldUtils')
const errorUtils = require('./errorUtils');
const { CommonError,
    BadRequestError,
    NotFoundError,
    AuthorizationError,
    ForbiddenError } = errorUtils;


const resultDeal = (cb) => {
    return async (req, res, next) => {
        await contextUtils.run(async () => {
            // let trackId = `${dayjs().format('YYYYMMDDHHmmssms')}${idUtils.countId()}${Math.floor(Math.random()*1000)}`;
            let trackId = `${new Date().getTime()}${idUtils.countId()}${Math.floor(Math.random() * 1000)}`;
            contextUtils.put('fwTrack', trackId);
            contextUtils.put('httpReq', req);
            contextUtils.put('httpRes', res);

            let startTime = new Date().getTime();
            try {
                let result = await cb(req, res, next);
                result = result === undefined ? null : result;
                if (result instanceof RespResult && result._fw_not_response) {
                    return;
                }

                let endTime = new Date().getTime();
                let runTime = endTime - startTime;
                log.info(`请求数据成功，method:${req.method}, url: ${util.getRoutePath(req)}, time:${runTime}`);

                if (result instanceof RespResult) {
                    res.send(result);
                    return;
                }
                if (result instanceof ResultList) {
                    return util.ReponseList(req, res, result.data, result.pageSize, result.pageNo, result.total, result.averageTime);
                } else {
                    return util.ReponseSuss(req, res, result);
                }
            } catch (err) {
                let endTime = new Date().getTime();
                let runTime = endTime - startTime;
                log.error(`请求数据出错，method:${req.method}, url: ${req.originalUrl}, time:${runTime}\n`, err);
                // log.error(`请求数据出错，method:${req.method}, url: ${req.baseUrl + req.route.path}, time:${runTime}\n`, err);
                let result = { ...SERVER }
                if (err instanceof BadRequestError) {
                    result = { ...BAD_REQUEST };
                } else if (err instanceof AuthorizationError) {
                    result = { ...UNAUTHORIZED };
                } else if (err instanceof ForbiddenError) {
                    result = { ...FORBIDDEN };
                } else if (err instanceof NotFoundError) {
                    result = { ...NOT_FOUND };
                } else if (err instanceof CommonError) {
                    result = { ...SERVER };
                }
                {
                    let code = err.code;
                    if (code) {
                        if (typeof code == 'object') {
                            result = code;
                        } else {
                            result.errorCode = code ? code : result.errorCode;
                        }
                    }
                    result.message = err.message ? err.message : result.message;
                }
                result.errorData = err.errorData;
                return res.send(result);
            }
        });
    };
}

// {
//     id: user._id,
//     email: user.email,
//     siteId: user.siteId,
//     type: 'token',
//     roleCodes
// }
/**
 * 
 * @param {any} req 
 * @param {boolean} info 
 * @returns {Promise<{id:string, siteId:string, email:string, roleCodes:string[]}>}
 */
const getUser = async (req, info = false) => {
    let auth = require('../middleware/validate.middleware').getAuth(req);
    if (info) {
        return auth ? { ...auth.user, siteId: req.siteId } : null;
    } else {
        return auth ? { ...auth.tokenMsg, siteId: req.siteId?._id } : null;
    }
}


class RespResult {
    constructor(data = {
        _fw_not_response: false,
        status: 200,
        message: `Successfully`,
        total: null,
        pageSize: null,
        pageNo: null,
        data: null,
    }) {
        this.status = data.status;
        this.message = data.message;
        this.total = data.total;
        this.pageSize = data.pageSize;
        this.pageNo = data.pageNo;
        this.data = data.data;
        this._fw_list = true;
        this._fw_consoller = true;
        this._fw_not_response = data._fw_not_response;
    }
}
class ResultList {
    constructor(data, param = { total: null, pageSize: null, pageNo: null, averageTime: null }) {
        this.data = data;
        if (param != null) {
            this.total = param.total;
            this.pageSize = param.pageSize;
            this.pageNo = param.pageNo;
            this.averageTime = param.averageTime;
        }
    }
}


module.exports = {
    ...serviceUtils,

    resultDeal,

    getUser,

    ResultList,
    RespResult,

    ...errorUtils,
}

