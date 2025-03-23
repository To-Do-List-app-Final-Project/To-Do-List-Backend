const express = require("express")
const Operation = require("./tasks.operation")
const router = express.Router()

router.post("/", Operation.create)
router.put("/:id", Operation.update)
router.delete("/:id", Operation.destroy)
router.get("/:id", Operation.getOne)
router.get("/", Operation.lists)

module.exports = router
