const express = require('express');
const router = express.Router();
const { sendSupportEmail } = require('../Controllers/supportController');

router.post('/', sendSupportEmail);

module.exports = router; 