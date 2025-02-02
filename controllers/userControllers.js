const  User = require('../models/userSchema')
const Teacher = require('../models/teacherSchema')
const crypto = require('crypto');
const {sendEmail} = require('../utils/email')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v2: cloudinary } = require('cloudinary');


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
    let user = await User.findOne({ email: email.toLowerCase() });
    let userType = "student"; // Default user type

    if (!user) {
      user = await Teacher.findOne({ email: email.toLowerCase() });
      userType = "teacher"; // If found in Teacher collection, change type
    }

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
      id: user._id,
      email: user.email,
      name:user.name,
      interests:user.interests,
      type:userType, 
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


const fetchFeaturedTeachers = async (req, res) => {
  try {
    // Retrieve user details from the middleware (decoded JWT token)
    const { interests } = req.user;

    let featuredTeachers = [];

    if (interests && interests.length > 0) {
      // Case 1: Student has interests
      featuredTeachers = await Teacher.aggregate([
        {
          $match: {
            subjects: {
              $in: interests.map((interest) => new RegExp(`^${interest}$`, 'i')), // Case-insensitive matching using regex
            },
          },
        },
        { $sample: { size: 5 } }, // Randomly pick up to 5 teachers from the matched list
      ]);
    }

    // Fill the remaining slots with random teachers if needed
    if (featuredTeachers.length < 5) {
      const additionalTeachers = await Teacher.aggregate([
        {
          $match: {
            _id: { $nin: featuredTeachers.map((teacher) => teacher._id) }, // Exclude already selected teachers
          },
        },
        { $sample: { size: 5 - featuredTeachers.length } }, // Fetch remaining teachers to make a total of 5
      ]);

      featuredTeachers = [...featuredTeachers, ...additionalTeachers];
    }

    // Ensure there are always exactly 5 teachers
    if (featuredTeachers.length < 5) {
      const remainingTeachers = await Teacher.find()
        .limit(5 - featuredTeachers.length) // Fetch remaining teachers to make up for missing entries
        .lean();

      featuredTeachers = [...featuredTeachers, ...remainingTeachers];
    }

    return res.status(200).json({
      statusCode: 200,
      message: 'Featured teachers fetched successfully',
      data: featuredTeachers.slice(0, 5), // Limit the final array to 5 teachers
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

const fetchProfileDetails = async (req, res) => {
  try {
    // Retrieve the email_id from the middleware (decoded JWT token)
    const { email } = req.user;

    // Fetch user details from the database using the email
    const user = await User.findOne({ email }, {
      name: 1,
      nickname: 1,
      collegename: 1,
      city: 1,
      mobileNumber: 1,
      fullAddress: 1,
      interests: 1,
      email: 1,
      profile_pic_url: 1,
      _id: 0 // Exclude _id field
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found',
        data: null
      });
    }

    // Respond with user details
    return res.status(200).json({
      statusCode: 200,
      message: 'User profile fetched successfully',
      data: user
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      statusCode: 500,
      message: 'Server error',
      data: { error: err.message }
    });
  }
};



const updateProfile = async (req, res) => {
  try {
    const { email } = req.user; // Email fetched from middleware (JWT)
    const {
      full_name,
      nickname,
      date_of_birth,
      phone_number,
      collegename,
      interests,
      gender,
      city
    } = req.body;

    const profile_pic = req.file?.path; // File path from multer (uploaded image)

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: 'User not found',
        data: null,
      });
    }

    const updates = {};

    // Delete old profile picture from Cloudinary if a new picture is uploaded
    if (profile_pic) {
      if (user.profile_pic_url) {
        const oldPublicId = user.profile_pic_url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(oldPublicId, (err, result) => {
          if (err) {
            console.error('Error deleting old profile pic:', err);
          } else {
            console.log('Old profile pic deleted successfully:', result);
          }
        });
      }

      // Upload new profile picture to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(profile_pic, {
        folder: 'user_profiles',
      });
      updates.profile_pic_url = uploadResponse.secure_url; // Save the new Cloudinary URL
    }

    // Update fields if provided
    if (full_name) updates.name = full_name;
    if (nickname) updates.nickname = nickname;
    if (date_of_birth) updates.date_of_birth = date_of_birth;
    if (phone_number) updates.mobileNumber = phone_number;
    if (collegename) updates.collegename = collegename;
    if (Array.isArray(interests)) updates.interests = interests;
    if (gender) updates.gender = gender;
    if (city) updates.city = city;

    // Update the user in the database
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: updates },
      { new: true } // Return the updated user
    );

    return res.status(200).json({
      statusCode: 200,
      message: 'Profile updated successfully',
      data: updatedUser,
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


module.exports = {sendEmailOTP,verifyOTP, registerUserDetails,loginUser,fetchFeaturedTeachers,fetchProfileDetails,updateProfile};