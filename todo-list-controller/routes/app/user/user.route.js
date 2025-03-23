const express = require("express")
const Operation = require("./user.operation")
const router = express.Router()

router.get("/operator", Operation.getOperator)
router.get("/reviewers", Operation.getReviewer)
router.get("/pwdValidity", Operation.pwdValidity)
router.put("/defaultSite", Operation.changeDefaultSite)
router.put("/dashboard", Operation.setDashboard)
router.put("/:id/changePassword", Operation.changePassword)
router.get("/:id", Operation.employeeDetail)

module.exports = { router, Operation }
