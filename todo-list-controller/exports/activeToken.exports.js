const jwt = require("jsonwebtoken")
const util = require("./util")
const { BadRequestError } = require("./operationUtils")
const log = require('./logUtils').getLogger('token.jwt')

const jwtSecret = process.env.JSON_SIGNATURE || "JXkWxYaqpvb90S-Z@sIoJxQyxS";

const generateToken = async (staffId, role) => {
    try {
        //* sign jsonwebtoken and expires in 30 minutes - will be removed from DB in 30 minutes
        const bdy = {
            staffId: staffId,
            role: role,
        }

        const token = await jwt.sign(bdy, jwtSecret, {
            expiresIn: process.env.LOGIN_EXPIRE ? process.env.LOGIN_EXPIRE : 1800,
        })

        const tokenobj = new ActiveStaffToken(
            Object.assign(bdy, {
                token: token,
            })
        )

        const results = await tokenobj
            .save()
            .then((succ) => ({ success: 1, token: succ.token }))
            .catch((err) => ({ success: 0, message: err.message }))

        return results
    } catch (err) {
        return { success: 0, message: err.message }
    }
}

const generateEmployeeToken = async (entity) => {
    try {
        const bdy = {
            id: entity._id,
            email: entity.email,
            siteId: entity.siteId,
            roleCodes: [],
        }

        const token = await jwt.sign(bdy, jwtSecret, {
            expiresIn: parseInt(process.env.LOGIN_EXPIRE),
        })

        return "Bearer " + token
    } catch (error) {
        return ""
    }
}

const buildToken = async (auth = {
    id: null,
    email: null,
    siteId: null,
    usrname: null,
    type: null,
}) => {
    let expire = parseInt(process.env.LOGIN_EXPIRE);
    const token = await jwt.sign(auth, jwtSecret, {
        expiresIn: expire
    });
    return { token, expire }
}

/**
 * 管理员登陆后生成token
 * @param {adminInfos} entity
 * @returns
 */
const generateAdminToken = async (entity) => {
    const bdy = {
        id: entity._id,
        email: entity.email,
        name: entity.name,
    }

    const token = await jwt.sign(bdy, jwtSecret, {
        expiresIn: parseInt(process.env.LOGIN_EXPIRE),
    })

    return "Bearer " + token
}

const verifyToken = (token) => {
    token = String(token).replace("Bearer ", "");
    return new Promise((r, j) => {
        jwt.verify(token, jwtSecret, (err, data) => {
            if (err) {
                log.error('Token信息错误', err);
                j(new BadRequestError());
            } else {
                r(data);
            }
        });
    });
}

const delayToken = async (data) => {
    let now = (timestamp = new Date().getTime())

    if (data.exp - parseInt(now / 1000) < 30 * 60) {
        return generateEmployeeToken({
            _id: data._id,
            firstName: data.firstName,
            siteId: data.siteId,
        })
    }

    return ""
}

const generateDonorToken = async (entity) => {
    try {
        const bdy = {
            id: entity._id,
            email: entity.email,
            siteId: entity.siteId
        }

        const token = await jwt.sign(bdy, jwtSecret, {
            expiresIn: parseInt(process.env.LOGIN_EXPIRE),
        })

        return "Bearer " + token
    } catch (error) {
        return ""
    }
}

const getApiKeyEncode = async () => {
    try {
        const validApiKeys = process.env.MOBILE_API_KEYS.split(',');
        validApiKeys.push("r4jsCXygjhXc0NkQ")
        for(let vkey of validApiKeys) {
            const token = jwt.sign({ key: vkey }, jwtSecret)
            console.log(vkey, token);
        }
        return ""
    } catch (error) {
        return ""
    }
}

module.exports = {
    buildToken,
    generateToken,
    generateEmployeeToken,
    verifyToken,
    delayToken,
    generateAdminToken,
    generateDonorToken,
    getApiKeyEncode
}
