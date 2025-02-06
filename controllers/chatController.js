const Conversation = require('../models/conversationSchema');
const Message = require('../models/messagesSchema');
const cloudinary = require('../config/cloudinaryConfig');

// Send Message (Text or Attachment)
const sendMessage = async (req, res) => {
  try {
    console.log(req.body)
    console.log(req.id)
    console.log(req.type)
    console.log("extracted etails = ", req.user)
    const { receiverId, receiverType, message } = req.body;
    const senderId = req.user.id;  // Extracted from JWT middleware
    const senderType = req.user.type;

    // Generate unique conversationId (sorted for consistency)
    const conversationId = [senderId, receiverId].sort().join('_');

    // Check if conversation exists
    let conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      // Create new conversation if not exists
      conversation = new Conversation({
        conversationId,
        users: [
          { userId: senderId, userType: senderType },
          { userId: receiverId, userType: receiverType },
        ],
      });
      await conversation.save();
    }

    // Handle single attachment upload to Cloudinary
    let attachmentData = { url: '', type: '' };
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: req.file.mimetype.startsWith('video') ? 'video' : 'auto' },
          (error, uploadedFile) => {
            if (error) reject(error);
            else resolve(uploadedFile);
          }
        ).end(req.file.buffer);
      });

      attachmentData = { url: result.secure_url, type: req.file.mimetype };
    }

    // Create and store message
    const newMessage = new Message({
      conversationId,
      senderId,
      senderType,
      message: message || '',
      attachment: attachmentData,
    });

    await newMessage.save();

    // Update conversation last message
    conversation.lastMessage = message || 'File uploaded';
    conversation.lastMessageTimestamp = new Date();
    await conversation.save();

    return res.status(200).json({ conversationId, message: newMessage });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};


const getAllConversations = async (req, res) => {
    try {
      const userId = req.user.id; 
  
      // Find all conversations where the user is involved
      const conversations = await Conversation.find({ 'users.userId': userId })
        .sort({ lastMessageTimestamp: -1 }) // Sort by latest message
        .lean();
  
      return res.status(200).json(conversations);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  
  const getConversationMessages = async (req, res) => {
    try {
      const { conversationId } = req.params;
  
      // Find messages in the conversation
      const messages = await Message.find({ conversationId }).sort({ timestamp: 1 });
  
      return res.status(200).json(messages);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  


module.exports = {getConversationMessages,getAllConversations,sendMessage}