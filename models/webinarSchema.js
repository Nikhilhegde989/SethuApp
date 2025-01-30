const mongoose = require('mongoose');

const webinarSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher", // Assuming you have a Teacher model
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true, // This is the actual date when the webinar is happening
    },
    link: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, // The date when the webinar was added to the system
    },
  });
  

module.exports = mongoose.model("Webinar", webinarSchema);