const util = require("../exports/util")
const conn = require("../models/connection")
const {  } = require("../errorcodes/index.code")
const serviceUtils = require("../exports/serviceUtils")
const { ACCESS_LVL, SITE_CATEGORY } = require("../exports/literal");
const { centerBasicInfo } = require("../exports/fieldSelect")

/**
 * 当添加用户或更新用户时，检查邮件或手机号是否已存在
 * @param {*} user
 * @return bool
 */
const UserIsExtis = async (user) => {
    let id = String(user._id)
    if (id == "") {
        let count = await conn.pacsdb
            .collection("users")
            .find({ $or: [{ email: user.email }, { phone: user.phone }] })
            .count()
        console.info("共有:", count)
        return count > 0
    }

    //当是更新时
    let rspEmail = await conn.pacsdb
        .collection("users")
        .findOne({ email: user.email })
        .catch((error) => {
            throw error
        })
    if (!util.isEmpty(rspEmail)) {
        if (String(rspEmail._id) != id) {
            return true
        }
    }

    let rspPhone = await conn.pacsdb
        .collection("users")
        .findOne({ phone: user.phone })
        .catch((error) => {
            throw error
        })

    if (!util.isEmpty(rspPhone)) {
        if (String(rspPhone._id) != id) {
            return true
        }
    }
    return false
}

/**
 * 某用户能管理的sites的查询对象
 * @param {*} req
 */
const querySiteIds = (req) => {
    return {
        $in: [req.siteId?._id],
    }
}

/**
 * 获取当前登陆用户的siteId
 * @param {*} req
 * @returns
 */
const getCurrentSiteId = (req) => {
    return req.siteId?._id
}

/**
 * 验证当前登陆用户的密码是否正确
 * @param req
 * @param password
 * @returns {Promise<boolean>}
 */
const verifyPasswordForLoginUser = async (req, password) => {
    let rsp = await adminInfo
        .findOne({ _id: req.body.LoginUser._id, password: util.encode(password) })
        .catch((error) => {
            throw error
        })
    if (util.isEmpty(rsp)) {
        return false
    }
    return true
}

const countByQuery = async (query) => {
    query = {...query, isDeleted: { $ne: true }}
    let count = await adminInfo.find(query).count();
    return count;
}

const uniqUsername = async (value, id) =>
{
    let query = { username: { $regex: value+"$", $options: 'mi' }}
    if(util.notEmpty(id)) { query = { ...query, _id: { $ne: id }}}
    let existed = await countByQuery(query);
    serviceUtils.throwErrorWhenFalse(existed <= 0, EMPOYEE_USERNAME_UNIQUE)
    return true;
}

const uniqPhone = async (value, id) =>
{
    let query = { phone: { $regex: value+"$", $options: 'mi' }}
    if(util.notEmpty(id)) { query = { ...query, _id: { $ne: id }}}
    let existed = await countByQuery(query);
    serviceUtils.throwErrorWhenFalse(existed <= 0, EMPOYEE_PHONE_UNIQUE)
    return true;
}

const uniqEmail = async (value, id) =>
{
    let query = { email: { $regex: value+"$", $options: 'mi' }}
    if(util.notEmpty(id)) { query = { ...query, _id: { $ne: id }}}
    let existed = await countByQuery(query);
    serviceUtils.throwErrorWhenFalse(existed <= 0, EMPOYEE_EMAIL_UNIQUE)
    return true;
}

/**
 * get current user info
 * 
 * @param {*} req 
 * @returns 
 */
const getCurrentUserInfo = (req) => {
    return req.body.LoginUser;
}

const getAvailRegions = async (ids) =>
{
    let result = await region.find({ _id: { $in: [ ...ids ]}, isDeleted: { $ne: true }})
        .populate({
            path: "subRegions", match: { isDeleted: { $ne: true }},
            populate: { path: "centers", match: { status: { $ne: false }}, select: centerBasicInfo }
        })
        .populate({ path: "centers", match: { status: { $ne: false }}, select: centerBasicInfo })
        .catch((error) => { throw error });
    return result;
}

/**
 * Get filter by region and site/center
 * 
 * @param {*} req
 * @param {*} filter
 * @returns 
 */
const filterByRegionAndSite = async (req, filter) =>
{
    let { regionId, subRegionId, centerId } = req.query;
    let regIds = []; let subIds = []; let ctrIds = [];
    if(util.notEmpty(regionId)) {
        let regions = await getAvailRegions([regionId]);
        for(let reg of regions) {
            regIds.push(reg._id);
            if(util.isEmpty(subRegionId)) {
                for(let sreg of reg.subRegions) {
                    subIds.push(sreg._id);
                    for(let ctr of sreg.centers) {
                        if(util.notEmpty(ctr._id)) { ctrIds.push(ctr._id) }
                    }
                }
            }
        }
    }

    if(util.notEmpty(subRegionId)) {
        let subregions = await getAvailRegions([subRegionId]);
        for(let sreg of subregions) {
            subIds.push(sreg._id);
            if(util.isEmpty(centerId)) {
                for(let ctr of sreg.centers) {
                    if(util.notEmpty(ctr._id)) { ctrIds.push(ctr._id) }
                }
            }
        }
    }

    if(util.notEmpty(centerId)) {
        ctrIds = [centerId]
    }

    let _or = [];

    if(util.notEmpty(regIds)) { _or.push({ regions: { $in: regIds }}); }
    if(util.notEmpty(subIds)) { _or.push({ subRegions: { $in: [...new Set(subIds)] }}); }
    if(util.notEmpty(ctrIds)) { _or.push({ centers: { $in: [...new Set(ctrIds)] }}); }

    if(util.notEmpty(_or)) { filter.$and.push({ $or: _or }); }

    return filter;
}

/**
 * Get filter by access level
 * 
 * @param {*} req 
 * @param {*} filter 
 * @returns 
 */
const filterAccessLvl = async (req, filter) =>
{
    let info = getCurrentUserInfo(req);
    if(info.accessLevel !== ACCESS_LVL.HQ) {
        let _or = [];
        if(info.accessLevel !== ACCESS_LVL.CTR) {
            let regIds = []; let subIds = []; let ctrIds = [];
            if(info.accessLevel === ACCESS_LVL.RG) {
                let regions = await getAvailRegions(info.regions);
                for(let reg of regions) {
                    regIds.push(reg._id);
                    for(let sreg of reg.subRegions) {
                        subIds.push(sreg._id);
                        for(let ctr of sreg.centers) {
                            if(util.notEmpty(ctr._id)) { ctrIds.push(ctr._id) }
                        }
                    }
                }
            } else {
                let subregions = await getAvailRegions(info.subRegions);
                for(let sreg of subregions) {
                    subIds.push(sreg._id);
                    for(let ctr of sreg.centers) {
                        if(util.notEmpty(ctr._id)) { ctrIds.push(ctr._id) }
                    }
                }
            }
            if(util.notEmpty(regIds)) { _or.push({ regions: { $in: regIds }}); }
            if(util.notEmpty(subIds)) { _or.push({ subRegions: { $in: [...new Set(subIds)] }}); }
            if(util.notEmpty(ctrIds)) { _or.push({ centers: { $in: [...new Set(ctrIds)] }}); }
        } else {
            _or.push({ centers: { $in: info.centers }});
        }
        if(util.notEmpty(_or)) { filter.$and.push({ $or: _or }); }
    }

    return filter;
}

/**
 * Get user centers/site by access level
 * 
 * @param {*} usrinfo 
 */
const getManageSites = async(usrinfo) =>
{
    let centers = [];
    if([ACCESS_LVL.HQ, ACCESS_LVL.CTR].includes(usrinfo.accessLevel)) {
        let query = { status: { $ne: false }, category: SITE_CATEGORY.CTR };
        if(util.notEmpty(usrinfo.centers)) {
            query._id = { $in: [ ...usrinfo.centers ]}
        }
        centers = await siteInfo.find(query, centerBasicInfo)
            .catch((error) => { throw error });
    }

    if([ACCESS_LVL.SRG, ACCESS_LVL.RG].includes(usrinfo.accessLevel)) {
        let regionIds = util.unique(usrinfo.regions.concat(usrinfo.subRegions));
        let regions = await getAvailRegions(regionIds);
        for(let reg of regions) {
            for(let sreg of reg.subRegions) {
                if(util.notEmpty(sreg.centers)) {
                    centers = centers.concat(sreg.centers)
                }
            }
            if(util.notEmpty(reg.centers)) {
                centers = centers.concat(reg.centers)
            }
        }
    }
    
    let checkCenter = centers.find((item) => String(item._id) === String(usrinfo.siteId._id));

    if(util.notEmpty(centers)) {
        if(util.isEmpty(usrinfo.siteId) || util.isEmpty(checkCenter)) {
            await adminInfo.updateOne({ _id: usrinfo._id }, { siteId: centers[0]._id })
            usrinfo.siteId = centers[0];
        }
        const sortedCenters = centers.sort((a, b) => a.name.localeCompare(b.name));
        usrinfo.centers = util.unique(sortedCenters);
    }

    return usrinfo;
}

const verifyRoleId = async (roleId, upData) => {
    let query = { _id: util.objectId(roleId), isDeleted: { $ne: true }, status: { $ne: false } }

    let rsp = await Roles.findOne(query)
        .lean().exec()
        .catch((err) => { throw err });
    serviceUtils.throwErrorWhenFalse(util.notEmpty(rsp), EMP_ROLE_UNDEFINED)

    upData.character = rsp.operationModel;
    return upData;
}

const verifyDepartmentId = async (departmentId) => {
    let query = { _id: util.objectId(departmentId), isDeleted: { $ne: true }, status: { $ne: false } }

    let rsp = await Department.findOne(query)
        .lean().exec()
        .catch((err) => { throw err });

    serviceUtils.throwErrorWhenFalse(util.notEmpty(rsp), EMP_DEPARTMENT_UNDEFINED)
    return true;
}

const verifyJobId = async (jobId) => {
    let query = { _id: util.objectId(jobId), isDeleted: { $ne: true }, status: { $ne: false } }

    let rsp = await Job.findOne(query)
        .lean().exec()
        .catch((err) => { throw err });

    serviceUtils.throwErrorWhenFalse(util.notEmpty(rsp), EMP_JOB_UNDEFINED)
    return true;
}

module.exports = {
    getCurrentSiteId,
    UserIsExtis,
    querySiteIds,
    verifyPasswordForLoginUser,
    uniqUsername,
    uniqPhone,
    uniqEmail,
    getCurrentUserInfo,
    filterAccessLvl,
    filterByRegionAndSite,
    getManageSites,
    verifyRoleId,
    verifyDepartmentId,
    verifyJobId
}
