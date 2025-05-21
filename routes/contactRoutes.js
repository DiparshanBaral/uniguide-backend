const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../controllers/contactController');

// Route for sending contact form emails
router.post('/send', sendContactEmail);

module.exports = router;