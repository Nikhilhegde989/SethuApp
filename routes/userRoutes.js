// routes/register.js
const express = require('express');
const { sendEmailOTP, verifyOTP, registerUserDetails, loginUser } = require('../controllers/userControllers');

const router = express.Router();

// Register route
router.post('/send-email-otp', sendEmailOTP);

router.get('/verify-otp',verifyOTP)

router.post('/register-details', registerUserDetails);

router.post('/login', loginUser);


module.exports = router;
