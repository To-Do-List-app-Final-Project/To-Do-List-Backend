const crypto = require("crypto")
const User = require("../../../models/user")
const Category = require("../../../models/categories");
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

const detail = async (req, res) => {
    try {
        let id = req.user?._id
        let query = {
            _id: id,
        }
        let rsp = await User.findOne(query)
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

        if (util.isEmpty(rsp)) {
            return util.ReponseFail(req, res, 400, "Failed " + error.message);
        }

        await Category.create([
            { title: "Work", color: "#FFB6B9", userId: rsp?._id },
            { title: "Personal", color: "#F6EEC7", userId: rsp?._id },
            { title: "Event", color: "#BEEBE9", userId: rsp?._id }
        ]).catch(error => { throw error; })

        return util.ReponseSuss(req, res, rsp)
    } catch (error) {
        return util.ReponseFail(req, res, 400, "Failed " + error.message)
    }
}

const login = operationUtils.resultDeal(async (req, res) => {
    const { email, password } = req.body;
    serviceUtils.throwErrorWhenEmpty(email, ERROR_CODES, 'Email is empty');
    serviceUtils.throwErrorWhenEmpty(password, ERROR_CODES, 'Password is empty');

    let query = {
        $or: [{ email: email }, { username: email }],
        password: util.encode(password),
        status: { $ne: false }, isDeleted: { $ne: true }
    }
    let user = await User.findOne(query).lean().exec();

    if (util.isEmpty(user)) {
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

// 当前登陆的信息
const me = async (req, res) => {
    try {
        serviceUtils.throwBadRequestWhenEmpty(req.usrinfo, ERROR_CODES.BAD_REQUEST);
        let usr = await User.findOne({ _id: req.usrinfo?._id, status: { $ne: false }, isDeleted: { $ne: true } })
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
                match: { status: { $ne: false } },
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

const requestResetPwd = async (req, res) => {
    try {
        const { loginKey } = req.body;

        const staff = await User.findOne({ $or: [{ email: loginKey }, { username: loginKey }], isDeleted: { $ne: true } })
            .catch((err) => { throw err });

        if (util.notEmpty(staff)) {
            const passcode = util.generateRandomUniqueNumber(staff.username);
            const resetPasswordToken = crypto.randomBytes(20).toString("hex");
            const resetExpires = Date.now() + (1000 * 60 * 60); // Token expires in 1 hrs
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

module.exports = {
    me,
    login,
    getEntityById,
    changePassword,
    detail,
    requestResetPwd,
    register
}
