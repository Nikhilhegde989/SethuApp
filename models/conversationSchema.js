const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    unique: true,
    required: true,
  },
  users: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userType: { type: String, enum: ['student', 'teacher'], required: true },
    },
  ],
  lastMessage: { type: String, default: '' },
  lastMessageTimestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
