const express = require("express")
const Operation = require("./user.operation")
const router = express.Router()

router.put("/:id/changePassword", Operation.changePassword)
router.get("/detail", Operation.detail)

module.exports = { router, Operation }
