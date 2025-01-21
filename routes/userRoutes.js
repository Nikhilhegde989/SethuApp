// routes/register.js
const express = require('express');
const { sendEmailOTP, verifyOTP, registerUserDetails, loginUser,fetchFeaturedTeachers } = require('../controllers/userControllers');
const {authenticateToken} = require('../controllers/middleware')

const router = express.Router();

// Register route
router.post('/send-email-otp', sendEmailOTP);

router.get('/verify-otp',verifyOTP)

router.post('/register-details', registerUserDetails);

router.post('/login', loginUser);

router.get('/featured-teachers', authenticateToken, fetchFeaturedTeachers);


module.exports = router;
