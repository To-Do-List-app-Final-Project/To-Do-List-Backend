const express = require('express');
const validate = require("../../middleware/validate.middleware");
const staffValidation = require("../../validations/staff.validation.js");
const StaffAccountOperation = require("./accountoperation.staff");
const router = express.Router();

router.post("/register", validate(staffValidation.register, true), StaffAccountOperation.register);
router.post("/login", validate(staffValidation.login), StaffAccountOperation.login);

// router.post("/assign-new-role", validate(authValidation.register, ["admin", "headquater"]), authController.register);

module.exports = router;