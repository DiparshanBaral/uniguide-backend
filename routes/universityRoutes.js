const express = require('express');
const { addUniversity } = require('../controllers/universityController');
const router = express.Router();

// Route to add a new university (no admin protection for now)
router.post('/add', addUniversity);

module.exports = router;
