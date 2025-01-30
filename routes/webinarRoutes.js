const express = require('express');
const router = express.Router();
const {authenticateToken} = require('../controllers/middleware')
const {getUpcomingWebinars} = require('../controllers/webinarController')

router.get("/upcoming", authenticateToken,getUpcomingWebinars);

module.exports = router;
