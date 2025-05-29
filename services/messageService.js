const Message = require('../models/Message');

class MessageService {
    async getAll() {
        return await Message.find().sort({ timestamp: 1 });
    }

    async create(messageData) {
        const newMessage = new Message(messageData);
        return await newMessage.save();
    }

    async getConversation(user1Id, user2Id) {
        return await Message.find({
            $or: [
                { senderId: user1Id, receiverId: user2Id },
                { senderId: user2Id, receiverId: user1Id }
            ]
        }).sort({ timestamp: 1 });
    }

    async getConversationsForUser(userId) {
        // Obtener todos los mensajes donde el usuario es remitente o destinatario
        const messages = await Message.find({
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ]
        }).sort({ timestamp: -1 });

        // Extraer IDs únicos de las conversaciones
        const conversationUsers = new Set();
        messages.forEach(msg => {
            if (msg.senderId.toString() !== userId.toString()) {
                conversationUsers.add(msg.senderId.toString());
            }
            if (msg.receiverId.toString() !== userId.toString()) {
                conversationUsers.add(msg.receiverId.toString());
            }
        });

        return Array.from(conversationUsers);
    }
}

module.exports = MessageService;
