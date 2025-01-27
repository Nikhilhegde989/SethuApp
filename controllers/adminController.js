const Admin = require('../models/adminSchema')
const jwt = require('jsonwebtoken');

// Login controller
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
    console.log("\n request received at the backend login route")
  try {
    // Find the admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Compare the plain text password
    if (password !== admin.password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: admin._id, email: admin.email, name:admin.name }, process.env.JWT_SECRET_KEY, {
      expiresIn: '24h', // Token expires in 24 hours
    });

    // Set the token in a cookie
    res.cookie('token', token, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    });

    // Send success response
    res.status(200).json({ message: 'Login successful', redirect: '/admin/home' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { loginAdmin };