const ErrorCode = require("../errorcodes/index.code")
const util = require("../exports/util")
const ActiveToken = require("../exports/activeToken.exports")
const User = require("../routes/app/user/user.operation")
const operationUtils = require('../exports/operationUtils')
const serviceUtils = require('../exports/serviceUtils')
const userService = require("../services/user.services")
const { ACCESS_LVL } = require("../exports/literal")

const power = () => {
    return operationUtils.resultDeal(async (req, res, next) => {
        //验证token
        if (!req.headers.authorization) {
            throw new operationUtils.CommonError(ErrorCode.NO_TOKEN);
        }
        let tokenMsg = null;
        try {
            tokenMsg = await ActiveToken.verifyToken(req.headers.authorization)
        } catch (err) {
            throw new operationUtils.CommonError(ErrorCode.TOKEN_ERROR);
        }

        //获取登陆用户的详情
        //TODO: TO Refactor 1. Check user exist, status, deleted, eligible
        let user = await User.getEntityById(tokenMsg.id);
        if (serviceUtils.isNull(user)) { throw new operationUtils.CommonError(ErrorCode.TOKEN_ERROR); }

        req.user = user;

        //verify auth 是否启用权限验证,调试时可以暂时关闭
        if (parseInt(process.env.IsCheckAuth) == 1) {
            if (!(await Validate.isHasAuthRoute(req, user))) {
                return util.ReponseFail(req, res, 403, "No Auth")
            }
        }

        req.getAuth = () => { return { tokenMsg, user }; } // TODO: TO Remove after refactor 
        next();
        return new operationUtils.RespResult({ _fw_not_response: true });
    });
}

/**
 * 
 * @param {*} req 
 * @returns {{tokenMsg:{id, siteId, email, roleCodes}}}
 */
 // TODO: TO Remove after refactor 
const getAuth = (req) => {
    if (req.getAuth) {
        return req.getAuth();
    } else {
        return null;
    }
}


/**
 * app端用户需要登陆
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
const appLogin = async function (req, res, next) {
    //请求是否有token
    if (util.isEmpty(req.headers.authorization)) {
        return util.ResFail(req, res, 400, ErrorCode.NO_TOKEN)
    }

    //验证token
    let employee = await ActiveToken.verifyToken(req.headers.authorization)
    if (typeof employee == "string") {
        return util.ReponseFail(req, res, 401, employee)
    }

    if (JSON.stringify(employee) == "{}" || employee.id == "") {
        return util.ReponseFail(req, res, 400, "No login")
    }

    //签发新token
    newToken = await ActiveToken.delayToken(employee)
    req.body.newJwtToken = newToken != "" ? newToken : ""

    //获取登陆用户的详情
    let entity = await User.getEntityById(employee.id)
    if (util.isEmpty(entity)) {
        return util.ReponseFail(req, res, 403, "Login Expired")
    }

    req.body.LoginUser = entity

    //verify auth 是否启用权限验证,调试时可以暂时关闭
    if (parseInt(process.env.IsCheckAuth) == 1) {
        if (!(await Validate.isHasAuthRoute(req, entity))) {
            return util.ReponseFail(req, res, 403, "No Auth")
        }
    }

    next()
}

const adminLogin = async function (req, res, next) {
    if (util.isEmpty(req.headers.authorization)) {
        return util.ReponseFail(req, res, 400, "No Token")
    }

    let admin = await ActiveToken.verifyToken(req.headers.authorization)
    if (typeof admin == "string") {
        return util.ReponseFail(req, res, 401, admin)
    }

    if (JSON.stringify(admin) == "{}" || admin.id == "") {
        return util.ReponseFail(req, res, 400, "No login")
    }

    newToken = await ActiveToken.delayToken(admin)
    req.body.newJwtToken = newToken != "" ? newToken : ""

    next()
}

const donorPower = () => {
    return operationUtils.resultDeal(async (req, res, next) => {
        //验证token
        if (!req.headers.authorization) {
            throw new operationUtils.CommonError(ErrorCode.NO_TOKEN);
        }
        let tokenMsg = null;
        try {
            tokenMsg = await ActiveToken.verifyToken(req.headers.authorization)
        } catch (err) {
            throw new operationUtils.CommonError(ErrorCode.TOKEN_ERROR);
        }

        //Get details of logged in donor
        let donor = await donorService.getDetailById(tokenMsg.id);
        if (serviceUtils.isNull(donor)) {
            throw new operationUtils.CommonError(ErrorCode.TOKEN_ERROR);
        }

        req.usrinfo = donor; // It's incorrect 
        req.body.LoginDonor = donor // TODO: To fixed all used req.body.LoginDonor => req.usrinfo
        let siteId = donor.siteId;
        if(req.headers.siteid) {
            siteId = await siteInfos.findOne(util.objectId(req.headers.siteid))
                .lean().exec()
                .catch((err) => { throw err });
        }
        req.siteId = siteId;

        req.getAuth = () => { return { tokenMsg, donor }} // TODO: TO Remove after refactor 
        next();
        return new operationUtils.RespResult({ _fw_not_response: true });
    });
}

/**
 * Validate authorization from mobile app
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const mobilePower = async (req, res, next) => {
    try {
        // TODO: Check donor login token

        if (util.isEmpty(req.headers['x-api-key'])) {
            return util.ResFail(req, res, ErrorCode.NO_TOKEN)
        }

        const token = await ActiveToken.verifyToken(req.headers['x-api-key']);
        const validApiKeys = process.env.MOBILE_API_KEYS.split(',');
        if(util.notEmpty(token) && validApiKeys.includes(token.key)) {
            req.siteId = { _id: "62f471d168e2e67559899598" }; // static siteId
            return next();
        }

        return util.ResFail(req, res, ErrorCode.UNAUTHORIZED)
    } catch (err) {
        console.log(err)
        return util.ResFail(req, res, ErrorCode.TOKEN_ERROR)
    }
}

/**
 * Validate authorization from mobile app
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const publicAccess = async (req, res, next) => {
    try {
        let accessKey = req.headers['x-api-key'];

        if (util.isEmpty(accessKey)) {
            return util.ResFail(req, res, ErrorCode.NO_TOKEN)
        }

        const token = await ActiveToken.verifyToken(req.headers['x-api-key']);
        const validApiKeys = process.env.MOBILE_API_KEYS.split(',');
        if(util.notEmpty(token) && validApiKeys.includes(token.key)) {
            req.siteId = { _id: req.headers.siteid ?? "62f471d168e2e67559899598" }; // static siteId
            return next();
        }

        return util.ResFail(req, res, ErrorCode.PUBLIC_UNAUTHORIZED)
    } catch (err) {
        console.log(err)
        return util.ResFail(req, res, ErrorCode.TOKEN_ERROR)
    }
}


const validate = (schema, auth) => async (req, res, next) => {
  const { value, error }  = Joi.compile(schema).validate(req.body);

  if(error){
    return res.send({status: 400, message: error.message});
  };
}

module.exports = { validate, appLogin, adminLogin, power, getAuth, donorPower, mobilePower, publicAccess }
