const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    required: true,
  },
  profilePicUrl: {
    type: String, // URL for the profile picture
  },
  subjects: {
    type: [String], // Array of strings representing subjects taught
    required: true,
  },
  type: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'teacher', 
  },
  posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post"
    }],
  events: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      date: {
        type: Date, // Date of the event/webinar
        required: true,
      },
      time: {
        type: String, // e.g., '5:00 PM'
        required: true,
      },
      duration: {
        type: String, // e.g., '2 hours'
        required: true,
      },
      fee: {
        type: Number, // Fee for the event/webinar
        default: 0, // Default is free
      },
    },
  ],
});

module.exports = mongoose.model('Teacher', teacherSchema);
