const Webinar = require("../models/webinarSchema");

const getUpcomingWebinars = async (req, res) => {
    try {
      const upcomingWebinars = await Webinar.find({ scheduledDate: { $gte: new Date() } })
        .sort({ scheduledDate: 1 }) // Sort by the nearest date
        .limit(5)
        .populate("teacher", "name email"); // Populate teacher details
  
      res.status(200).json({ status_code:200,success: true, webinars: upcomingWebinars });
    } catch (error) {
      res.status(500).json({ status_code:500,success: false, message: "Server Error", error: error.message });
    }
  };

module.exports = {getUpcomingWebinars}