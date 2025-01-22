// routes/register.js
const express = require('express');
const { sendEmailOTP, verifyOTP, registerUserDetails, loginUser,fetchFeaturedTeachers, fetchProfileDetails,updateProfile } = require('../controllers/userControllers');
const {authenticateToken} = require('../controllers/middleware')
const router = express.Router();
const upload = require('../config/multerConfig'); // import multer config

// Register route
router.post('/send-email-otp', sendEmailOTP);

router.get('/verify-otp',verifyOTP)

router.post('/register-details', registerUserDetails);

router.post('/login', loginUser);

router.get('/featured-teachers', authenticateToken, fetchFeaturedTeachers);

router.get('/get-profile', authenticateToken, fetchProfileDetails)

router.post('/update-profile', authenticateToken, upload.single('profile_pic'), updateProfile);

module.exports = router;
