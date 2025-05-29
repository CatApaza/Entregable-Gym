const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    username: String,
    message: String,
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' },
    senderType: { type: String, enum: ['entrenador', 'cliente'] },
    receiverType: { type: String, enum: ['entrenador', 'cliente'] },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('messages', messageSchema);
