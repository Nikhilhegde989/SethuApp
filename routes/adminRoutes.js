const express = require('express');
const { loginAdmin } = require('../controllers/adminController');
const {authenticateToken} = require('../controllers/middleware')
const path = require('path');
const router = express.Router();

// Login route
router.get('/login',(req,res)=>{
  console.log('Admin home route accessed'); // Debugging
  res.sendFile(path.join(__dirname, '../admin_pages/admin_login.html'));
});
router.post('/login', loginAdmin);

router.get('/home',authenticateToken, (req, res) => {
  console.log('Admin home route accessed'); // Debugging
  res.sendFile(path.join(__dirname, '../admin_pages/admin_home.html'));
});

module.exports = router;