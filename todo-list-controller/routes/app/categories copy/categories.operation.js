const util = require("../../../exports/util")
const Categories = require("../../../models/categories")
const { getNewCategoriesCode } = require("../../../services/newCode.services");

const create = async (req, res) => {
    try {
        const { title, color } = req.body
        const newCode = await getNewCategoriesCode();
        let data = {
            userId: req.user?._id,
            title: title,
            color: color,
            code: newCode
        }
        let rsp = await new Categories(data).save().catch((error) => {
            throw error
        })
        if (util.isEmpty(rsp)) {
            return util.ReponseFail(req, res, 400, "Create failed");
        }

        return util.ReponseSuss(req, res, rsp)
    } catch (error) {
        return util.ReponseFail(req, res, 400, error.message)
    }
}

const update = async (req, res) => {
    try {
        const { title, color } = req.body
        let userId = req.user?._id
        const id = req.params.id

        let data = {
            title: title,
            color: color,
        }

        const rsp = await Categories.updateOne({ _id: util.objectId(id), userId: util.objectId(userId) }, data).catch((error) => {
            throw error
        })

        if (rsp.modifiedCount > 0) {
            return util.ReponseSuss(req, res, {}, "Updated Successfully");
        }
        return util.ReponseFail(req, res, 400, "Update Failed")
    } catch (error) {
        return util.ReponseFail(req, res, 400, error.message)
    }
}

const destroy = async (req, res) => {
    try {
        let id = req.params.id
        let userId = req.user?._id

        const rsp = await Categories.updateOne({ _id: util.objectId(id), userId: util.objectId(userId) }, { $set: { isDeleted: true } })
            .catch(err => {
                throw err;
            });

        if (rsp.modifiedCount > 0) {
            return util.ReponseSuss(req, res, {}, "Deleted Successfully")
        }
        return util.ReponseFail(req, res, 400, "Delete has failed");
    } catch (error) {
        return util.ReponseFail(req, res, 500, error.message)
    }
}

const lists = async (req, res) => {
    try {
        const userId = req.user?._id;
        let query = { isDeleted: { $ne: true }, userId: util.objectId(userId) }

        let pageNo = util.defaultPageNo(req.query.pageNo)
        let pageSize = util.defaultPageSize(req.query.pageSize)

        let count = await Categories.find(query).count()
        if (count == 0) {
            return util.ReponseList(req, res, [], pageSize, pageNo, count)
        }

        let rsp = await Categories
            .find(query)
            .skip((pageNo - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: -1 })
            .catch((error) => {
                throw error
            })

        return util.ReponseList(req, res, rsp, pageSize, pageNo, count)
    } catch (error) {
        return util.ReponseFail(req, res, 500, error.message)
    }
}

const getOne = async (req, res) => {
    try {
        const userId = req.user?._id;
        let id = req.params.id
        let query = { _id: id, isDeleted: { $ne: true }, userId: util.objectId(userId) };
        let rsp = await Categories.findOne(query)
            .catch((error) => { throw error });

        if (util.isEmpty(rsp)) {
            return util.ReponseFail(req, res, 404, "Job not found");
        }
        return util.ReponseSuss(req, res, rsp);
    } catch (error) {
        return util.ReponseFail(req, res, 400, error.message)
    }
}

module.exports = { create, update, destroy, lists, getOne }
