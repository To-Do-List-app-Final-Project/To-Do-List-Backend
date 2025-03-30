const express = require("express")
const Operation = require("./user.operation")
const router = express.Router()

router.get("/detail", Operation.detail)
router.put("/:id/changePassword", Operation.changePassword)

module.exports = { router, Operation }
