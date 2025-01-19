const  User = require('../models/userSchema')
const crypto = require('crypto');
const {sendEmail} = require('../utils/email')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sendEmailOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Email is required',
      data: null,
    });
  }

  try {
    // Check if the email is already registered
    let user = await User.findOne({ email:email.toLowerCase() });

    if (user) {
      // Handle already registered users
      if (user.isVerified && user.fullyRegistered) {
        return res.status(200).json({
          statusCode: 200,
          message: 'You are already registered. Please log in.',
          data: {
            isVerified: true,
            fullyRegistered: true,
            emailSent: false,
          },
        });
      }

      if (user.isVerified && !user.fullyRegistered) {
        return res.status(200).json({
          statusCode: 200,
          message: 'Your email is verified. Please complete your registration.',
          data: {
            isVerified: true,
            fullyRegistered: false,
            emailSent: false,
          },
        });
      }

      // If the user exists but is not verified, generate a new OTP
      const { otp } = await generateAndSaveOtp(user);
      return await sendOtpToEmail(user, otp, res);
    }

    // If the user doesn't exist, create a new one and generate OTP
    user = new User({
      email:email.toLowerCase(),
      isVerified: false,
      fullyRegistered: false,
    });

    const { otp } = await generateAndSaveOtp(user);
    return await sendOtpToEmail(user, otp, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      statusCode: 500,
      message: 'Server error',
      data: { error: err.message },
    });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.query;

  if (!email || !otp) {
    return res.status(400).json({
      statusCode: 400,
      message: "Email and OTP are required",
      data: {
        isVerified: false,
        fullyRegistered: false,
      },
    });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email:email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
        data: {
          isVerified: false,
          fullyRegistered: false,
        },
      });
    }

    const { otp: storedOtp, otpExpiry, isVerified, fullyRegistered } = user;

    // Check if the user is already verified
    if (isVerified) {
      return res.status(200).json({
        statusCode: 200,
        message: "User is already verified",
        data: {
          isVerified,
          fullyRegistered,
        },
      });
    }

    // Check if OTP matches
    if (storedOtp !== otp) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid OTP",
        data: {
          isVerified,
          fullyRegistered,
        },
      });
    }

    // Check if OTP is expired
    const currentTime = new Date();
    if (currentTime > otpExpiry) {
      return res.status(400).json({
        statusCode: 400,
        message: "OTP has expired",
        data: {
          isVerified,
          fullyRegistered,
        },
      });
    }

    // OTP is valid and not expired - Update isVerified to true
    user.isVerified = true;
    user.otp = null; // Clear OTP after successful verification
    user.otpExpiry = null; // Clear OTP expiry
    await user.save();

    return res.status(200).json({
      statusCode: 200,
      message: "OTP verified successfully. User is now verified.",
      data: {
        isVerified: user.isVerified,
        fullyRegistered: user.fullyRegistered,
      },
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).json({
      statusCode: 500,
      message: "Server error during OTP verification",
      data: {
        isVerified: false,
        fullyRegistered: false,
        error: err.message,
      },
    });
  }
};


const registerUserDetails = async (req, res) => {
  const {
    email,
    name,
    password,
    collegename,
    city,
    mobileNumber,
    fullAddress,
    interests = [], // Optional field
  } = req.body;

  // Validate required fields
  if (!email || !name || !password || !collegename || !city || !mobileNumber || !fullAddress) {
    return res.status(400).json({
      statusCode: 400,
      message: 'All fields except interests are required',
      data: null
    });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email:email.toLowerCase() });

    if (!user || !user.isVerified) {
      return res.status(400).json({
        statusCode: 400,
        message: 'User is not verified or does not exist',
        data: {
          isVerified: user?.isVerified,
          fullyRegistered: user?.fullyRegistered
        },
      });
    }

    if (user.fullyRegistered) {
      return res.status(400).json({
        statusCode: 400,
        message: 'User is already fully registered',
        data: {
          isVerified: user.isVerified,
          fullyRegistered: user.fullyRegistered,
        },
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user details
    user.name = name;
    user.password = hashedPassword;
    user.collegename = collegename;
    user.city = city;
    user.mobileNumber = mobileNumber;
    user.fullAddress = fullAddress;
    user.interests = interests; // Optional list
    user.fullyRegistered = true;

    await user.save();

    return res.status(200).json({
      statusCode: 200,
      message: 'User details registered successfully',
      data: {
        isVerified: user.isVerified,
        fullyRegistered: user.fullyRegistered,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      statusCode: 500,
      message: 'Server error',
      data: {
        isVerified: false,
        fullyRegistered: false,
        error: err.message,
      },
    });
  }
};


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Email and password are required',
      data: null,
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found',
        data: null
      });
    }

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid credentials',
        data: {
          isVerified: user.isVerified,
          fullyRegistered: user.fullyRegistered,
        },
      });
    }


    // Generate the JWT (access token)
    const payload = {
      email: user.email,
    };

    // Sign the JWT with 1 day validity
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

    // Return success response with token
    return res.status(200).json({
      statusCode: 200,
      message: 'Login successful',
      data: {
        token,
        isVerified: user.isVerified,
        fullyRegistered: user.fullyRegistered,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      statusCode: 500,
      message: 'Server error',
      data: { error: err.message },
    });
  }
};

const sendOtpToEmail = async (user, otp, res) => {
  try {
    const emailResult = await sendEmail(
      'Your One-Time Password (OTP) Code',
      `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <h2 style="text-align: center; color: #4CAF50;">Your OTP for Email Verification</h2>
            <p>Dear User,</p>
            
            <p>We received a request to verify your email address. Please use the following <strong>One-Time Password (OTP)</strong> to complete the verification process:</p>
            
            <div style="text-align: center; padding: 15px; font-size: 24px; font-weight: bold; background-color: #f1f1f1; border: 1px solid #ddd; margin-bottom: 20px;">
              <span style="color: #4CAF50;">${otp}</span>
            </div>
            
            <p>This OTP is valid for <strong>15 minutes</strong> from the time of receipt. If you did not request this, please ignore this email or contact our support team immediately.</p>
    
            <p>Thank you,<br><strong>Team Sethu</strong></p>
            
            <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
              <p>For any assistance, you can reach out to us at <a href="mailto:support@sethu.com" style="color: #4CAF50;">support@sethu.com</a></p>
            </footer>
          </div>
        </body>
      </html>
      `,
      user.email.toLowerCase()
    );

    if (emailResult.success) {
      return res.status(200).json({
        statusCode: 200,
        message: 'OTP sent to email successfully',
        data: {
          user_email: user.email,
          isVerified: false,
          fullyRegistered: false,
          emailSent: true,
        },
      });
    } else {
      return res.status(500).json({
        statusCode: 500,
        message: 'Failed to send OTP',
        data: { emailSent: false },
      });
    }
  } catch (err) {
    console.error('Error sending email:', err);
    return res.status(500).json({
      statusCode: 500,
      message: 'Server error while sending OTP',
      data: { error: err.message },
    });
  }
};

const generateAndSaveOtp = async (user) => {
  try {
    // Generate a new OTP and set its expiry
    const otp = crypto.randomInt(1000, 9999).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Update the user's OTP and expiry in the database
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    return { otp, otpExpiry };
  } catch (err) {
    console.error('Error generating and saving OTP:', err);
    throw new Error('Failed to generate and save OTP');
  }
};


module.exports = {sendEmailOTP,verifyOTP, registerUserDetails,loginUser};