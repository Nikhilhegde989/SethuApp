const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  otp: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
  },
  nickname:{
    type: String
  },
  password: {
    type: String,
  },
  collegename: {
    type: String,
  },
  city: {
    type: String,
  },
  mobileNumber: {
    type: Number,
  },
  fullAddress: {
    type: String,
  },
  interests: {
    type: [String], // Array of strings
    default: [],
  },
  fullyRegistered: {
    type: Boolean,
    default: false, 
  },
  profile_pic_url:{
    type:String
  },
  gender:{
    type:String
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }]
});

module.exports = mongoose.model('User', userSchema);
