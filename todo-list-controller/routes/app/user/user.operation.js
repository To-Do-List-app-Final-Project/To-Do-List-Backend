const crypto = require("crypto")
const User = require("../../../models/user")
const util = require("../../../exports/util")
const errorUtils = require("../../../exports/errorUtils")
const { ROLE } = require("../../../exports/literal")
const dayjs = require("dayjs")
const operationUtils = require('../../../exports/operationUtils')
const serviceUtils = require('../../../exports/serviceUtils')
const ERROR_CODES = require('../../../errorcodes/index.code')
const service = require("../../../services/user.services")
const mailService = require("../../../services/mail.services")
const { centerBasicInfo } = require("../../../exports/fieldSelect")
const ActiveToken = require("../../../exports/activeToken.exports")

const changePassword = async (req, res) => {
    try {
        let id = req.params.id
        let { password, confirmPassword } = req.body
        let query = {
            _id: id,
        }
        let data = {
            password: util.encode(password),
        }
        let rsp = await User.updateOne(query, data).catch((err) => {
            throw err
        })
        if (rsp.modifiedCount > 0) {
            return util.ReponseSuss(req, res, {})
        }
        return util.ReponseError(req, res, 400, "Failed to update password")
    } catch (error) {
        return util.ReponseFail(req, res, 400, "Failed Change Password " + error.message)
    }
}

const employeeDetail = async (req, res) => {
    try {
        let id = req.params.id
        let query = {
            _id: id,
        }
        let rsp = await User.findOne(query)
            .populate("departmentId")
            .populate("jobId")
            .populate("roleId")
            .catch((error) => {
                throw error
            })
        return util.ReponseSuss(req, res, rsp)
    } catch (err) {
        return util.ReponseFail(req, res, 400, "Failed " + err.message)
    }
}

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existEmail = await User.findOne({ email: email }).catch((error) => { throw error });
        if (existEmail) {
            return util.ReponseFail(req, res, 400, "Email already exist")
        }

        const user = new User({
            username: username,
            email: email,
            password: util.encode(password),
            status: true
        })

        let rsp = await user.save().catch((error) => { throw error });

        return util.ReponseSuss(req, res, rsp)
    } catch (error) {
        return util.ReponseFail(req, res, 400, "Failed " + error.message)
    }
}

const login = operationUtils.resultDeal(async (req, res) =>
{
    const { email, password } = req.body;
    serviceUtils.throwErrorWhenEmpty(email, ERROR_CODES, 'Email is empty');
    serviceUtils.throwErrorWhenEmpty(password, ERROR_CODES, 'Password is empty');
    
    let query = {
        $or: [{ email: email }, { username: email }],
        password: util.encode(password),
        status: { $ne: false }, isDeleted: { $ne: true }
    }
    let user = await User.findOne(query).lean().exec();

    if(util.isEmpty(user)) {
        throw new serviceUtils.AuthorizationError();
    }

    let auth = {
        id: user._id,
        email: user.email,
        usrname: user.username,
        siteId: user.siteId,
        type: 'token'
    };
    let tokenMsg = await ActiveToken.buildToken(auth);
    return "Bearer " + tokenMsg.token;
});

//通过id和密码检查密码是否正确
const checkPasswordById = async (id, password) => {
    try {
        let query = {
            _id: id,
            password: util.encode(password),
        }

        let rsp = await User.findOne(query).catch((error) => {
            throw error
        })
        if (!util.isEmpty(rsp)) {
            return true
        }
        return false
    } catch (error) {
        return false
    }
}

// 当前登陆的信息
const me = async (req, res) => {
    try {
        serviceUtils.throwBadRequestWhenEmpty(req.usrinfo, ERROR_CODES.BAD_REQUEST);
        let usr = await User.findOne({ _id: req.usrinfo?._id, status: { $ne: false }, isDeleted: { $ne: true }})
            .populate("departmentId")
            .populate("jobId")
            .populate("roleId") 
            .populate({
                path: "regions",
                select: "name level subRegions centers",
                match: { isDeleted: { $ne: true } }
            })
            .populate({
                path: "subRegions",
                select: "name level subRegions centers",
                match: { isDeleted: { $ne: true } }
            })
            .populate({
                path: "siteId",
                match: { status: { $ne: false }},
                select: centerBasicInfo
            })
            .lean().exec()
            .catch((err) => { throw err })
        serviceUtils.throwNotFoundWhenEmpty(usr, ERROR_CODES.EMPOYEE_404);
    
        let employee = await service.getManageSites(usr);

        return util.ReponseSuss(req, res, employee)
    } catch (error) {
        console.log("error", error)
        return util.ResFail(req, res, errorUtils.ErrorHelper(error))
    }
}

// 根据ID获取某一个顾员的详情
const getEntityById = async (id) => {
    let rsp = await User.findOne({ _id: id })
        .lean().exec()
        .catch((error) => { throw error });

    return rsp
}

const pwdValidity = async (req, res) => {
    try {
        const { pwd, processId } = req.query
        let LoginUser = req.body.LoginUser;
        const isMatched = LoginUser.password == util.encode(pwd);
        if(util.notEmpty(processId) && isMatched) {
            await processService.confirmProcess(req, processId, LoginUser._id);
        }
        return util.ResSuss(req, res, isMatched)
    } catch (err) {
        return util.ResFail(req, res, err)
    }
}

const getOperator = async (req, res) => {
    try {
        const { character } = req.query;

        let aggrQuery = [
            {
                $match: {
                    siteId: req.siteId?._id,
                    character: character,
                    isLocked: { $ne: true }
                }
            },
            ...lookUpRole,
            { $sort: { createdAt: -1 } }
        ]

        let rsp = await User.aggregate(aggrQuery)
            .catch((error) => {
                throw error
            })

        return util.ReponseList(req, res, rsp)
    } catch (err) {
        return util.ReponseFail(req, res, 400, "Failed " + err.message)
    }
}

const getReviewer = async (req, res) => {
    try {
        let query = {
            // status: true,
            siteId: req.siteId?._id,
            character: { $nin: [ ROLE.MSA, ROLE.PHLEBO, ROLE.NURSE ]},
            isLocked: { $ne: true }
        }

        let rsp = await User.find(query)
            .select(`character firstName lastName middleName nickName status nameSuffix`)
            .sort({ createdAt: -1 })
            .catch((error) => { throw error })

        return util.ReponseList(req, res, rsp)
    } catch (err) {
        return util.ReponseFail(req, res, 400, "Failed " + err.message)
    }
}

const changeDefaultSite = async (req, res) => {
    try {
        let exceCenters = [];
        let { siteId } = req.body;
        serviceUtils.throwNotFoundWhenEmpty((req.usrinfo), ERROR_CODES.EMPOYEE_404);
        let employee = await service.getManageSites(req.usrinfo);
        if (util.notEmpty(employee)) {
            if(employee.siteId.id === siteId) {
                return util.ReponseFail(req, res, 400, "Failed to update for same siteId")
            }
            exceCenters = employee.centers.map((item) => item.id);
        }

        if (util.notEmpty(exceCenters)) {
            if (exceCenters.includes(siteId)) {
                let rsp = await User.updateOne({ _id: util.objectId(employee._id) }, { siteId: util.objectId(siteId) }).catch((err) => {
                    throw err
                })
                if (rsp.modifiedCount > 0) {
                    return util.ReponseSuss(req, res, {})
                }
            }
        }
        return util.ReponseFail(req, res, 400, "Failed to update default siteId")
    } catch (err) {
        return util.ReponseFail(req, res, 400, "Failed " + err.message)
    }
}

const requestResetPwd = async (req, res) => {
    try {
        const { loginKey } = req.body;

        const staff = await User.findOne({ $or: [{ email: loginKey }, { username: loginKey }], isDeleted: { $ne: true }})
            .catch((err) => { throw err });

        if (util.notEmpty(staff)) {
            const passcode = util.generateRandomUniqueNumber(staff.username);
            const resetPasswordToken = crypto.randomBytes(20).toString("hex");
            const resetExpires = Date.now() + (1000 * 60 * 60) ; // Token expires in 1 hrs
            staff.resetPasswordToken = resetPasswordToken;
            staff.resetPasswordExpires = resetExpires;
            staff.resetPasswordTries = 0;
            staff.resetPasswordCode = passcode;

            await staff.save().catch((err) => { throw err });

            const host = req.get("origin") || req.get("host");
            mailService.send(staff.email, `Reset Password Instructions`, mailService.setPwdContent(host, passcode, resetPasswordToken, `reset`));
        } else {
            return util.ResFail(req, res, ERROR_CODES.NOT_FOUND);
        }

        return util.ReponseSuss(req, res, {})
    } catch (error) {
        console.log("error", error)
        return util.ResFail(req, res, errorUtils.ErrorHelper(error))
    }
}

const setNewPassword = async (req, res) => {
    try {
        const { password, token, passcode } = req.body;

        const staff = await User.findOne({ isDeleted: { $ne: true }, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() }})
            .catch((err) => { throw err });
        if(util.isEmpty(staff)) {
            return util.ResFail(req, res, ERROR_CODES.EMP_ERROR_TOKEN)
        }

        if(staff.resetPasswordTries < 3 && !util.compareStr(passcode, staff.resetPasswordCode)) {
            staff.resetPasswordTries = staff.resetPasswordTries + 1;
            await staff.save().catch((err) => { throw err });
            return util.ResFail(req, res, ERROR_CODES.EMP_ERROR_PASSCODE)
        }

        // Reset
        staff.resetPasswordToken = null;
        staff.resetPasswordExpires = null;
        staff.resetPasswordCode = null;
        // only allow 3 times
        if(staff.resetPasswordTries >= 3) {
            await staff.save().catch((err) => { throw err });
            return util.ResFail(req, res, ERROR_CODES.EMP_MAX_TRY_TOKEN)
        }

        staff.password = util.encode(password)
        await staff.save().catch((err) => { throw err });

        return util.ReponseSuss(req, res, {})
    } catch (error) {
        console.log("error", error)
        return util.ResFail(req, res, errorUtils.ErrorHelper(error))
    }
}

const setDashboard = async (req, res) => {
    try {
        const { dashboard } = req.body;
        serviceUtils.throwBadRequestWhenEmpty(dashboard, ERROR_CODES.VAR_MESSAGE(ERROR_CODES.PARAM_NOT_NULL, ["dashboard"]));

        const usr = await User.countDocuments({ _id: req.usrinfo?._id, status: { $ne: false }, isDeleted: { $ne: true }});
        if(usr > 0) {
            await User.updateOne({ _id: req.usrinfo?._id }, { $set: { dashboard: dashboard }})
                .catch((err) => { throw err });

            return util.ReponseSuss(req, res, {});
        }

        return util.ResFail(req, res, ERROR_CODES.EMPOYEE_404);
    } catch (error) {
        console.log("error", error)
        return util.ResFail(req, res, errorUtils.ErrorHelper(error));
    }
}

module.exports = {
    me,
    checkPasswordById,
    login,
    getEntityById,
    changePassword,
    employeeDetail,
    pwdValidity,
    getReviewer,
    changeDefaultSite,
    getOperator,
    requestResetPwd,
    setNewPassword,
    setDashboard,
    register
}
