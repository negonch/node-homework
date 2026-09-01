const express = require("express");

const { register, logon, logoff } = require("../controllers/userController");

const router = express.Router();

const jwtMiddleware = require("../middleware/jwtMiddleware");

router.post("/register", register);
router.post("/logon", logon);
router.post("/logoff", jwtMiddleware, logoff);

module.exports = router;
