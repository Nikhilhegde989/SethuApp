const Post = require("../models/postSchema");
const cloudinary = require("../config/cloudinaryConfig");
const Student = require("../models/userSchema");
const Teacher = require("../models/teacherSchema");

// Create a new post
const createPost = async (req, res) => {
    try {
      console.log("image =",req.file)
      console.log("Buffer length: ", req.file.buffer ? req.file.buffer.length : 'No buffer');

      const { description } = req.body;
      const userId = req.user.id;  
      const userType = req.user.type;
  
      if (!description) {
        return res.status(400).json({ success: false, message: "Description is required" });
      }
  
      if (!["student", "teacher"].includes(userType)) {
        return res.status(400).json({ success: false, message: "Invalid user type" });
      }
  
      let imageUrl = null; // Default if no image is uploaded
  
      if (req.file) {
        // Upload image to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream({ folder: "posts" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
          uploadStream.end(req.file.buffer);
        });
  
        imageUrl = uploadResult.secure_url;
      }
  
      // Create new Post
      const newPost = new Post({
        description,
        imageUrl,
        user: userId,
        userType,
      });
  
      await newPost.save();
  
      // Store post ID in the respective collection
      if (userType === "student") {
        await Student.findByIdAndUpdate(userId, { $push: { posts: newPost._id } });
      } else if (userType === "teacher") {
        await Teacher.findByIdAndUpdate(userId, { $push: { posts: newPost._id } });
      }
  
      res.status(201).json({ success: true, message: "Post created successfully", post: newPost });
  
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  };
  

  const getAllPosts = async (req, res) => {
    try {
      const userId = req.user.id;   // Extract user ID from JWT
      const userType = req.user.type; // Extract user type (either "student" or "teacher")
      console.log("\n user details =", req.user)
      if (!["student", "teacher"].includes(userType)) {
        return res.status(400).json({ success: false, message: "Invalid user type" });
      }
  
      let user;
      // Find the user (either student or teacher)
      if (userType === "student") {
        user = await Student.findById(userId).populate({
          path: "posts",
          options: { sort: { createdAt: -1 } }, // Sort posts by creation date in descending order
          populate: { path: "user", select: "name email" }, // Populate user details for the post
        });
      } else if (userType === "teacher") {
        user = await Teacher.findById(userId).populate({
          path: "posts",
          options: { sort: { createdAt: -1 } }, // Sort posts by creation date in descending order
          populate: { path: "user", select: "name email" }, // Populate user details for the post
        });
      }
  
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      // The populated posts will be available on the `posts` array of the user object
      res.status(200).json({ success: true, posts: user.posts });
  
    } catch (error) {
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
  };
  
  
module.exports = { createPost, getAllPosts };
