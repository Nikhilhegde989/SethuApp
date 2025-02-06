const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, ref: 'Conversation' },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderType: { type: String, enum: ['student', 'teacher'], required: true },
  message: { type: String, default: '' },
  attachment: {
    url: { type: String, default: '' },
    type: { type: String, default: '' },
  },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
