const express = require('express');
const router = express.Router();
const { sendMessage, getAllConversations, getConversationMessages } = require('../controllers/chatController');
const { chatAttachmentUpload } = require('../config/multerConfig');
const {authenticateToken}  = require('../controllers/middleware')

// Send Message (Text or File)
router.post('/message',authenticateToken, chatAttachmentUpload.single('attachment'), sendMessage);

// Get Chat List (Like WhatsApp)
router.get('/conversations',authenticateToken, getAllConversations);

// Get All Messages in a Conversation
router.get('/messages/:conversationId',authenticateToken, getConversationMessages);

module.exports = router;
