const express = require("express");
const { loginAdmin } = require("../controllers/adminController");

const router = express.Router();

router.post("/login/admin", loginAdmin);

module.exports = router;
