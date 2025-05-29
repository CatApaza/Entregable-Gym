const mongoose = require('mongoose');

const mensajeAdminEntrenadorSchema = new mongoose.Schema({
    senderId: {
        type: String,
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    senderType: {
        type: String,
        enum: ['administrador', 'entrenador'],
        required: true
    },
    receiverId: {
        type: String,
        required: true
    },
    receiverName: {
        type: String
    },
    receiverType: {
        type: String,
        enum: ['administrador', 'entrenador'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Índices para búsquedas eficientes
mensajeAdminEntrenadorSchema.index({ senderId: 1, receiverId: 1 });
mensajeAdminEntrenadorSchema.index({ timestamp: -1 });

// Método estático para obtener conversación entre dos usuarios
mensajeAdminEntrenadorSchema.statics.getConversation = async function(user1Id, user2Id) {
    return this.find({
        $or: [
            { senderId: user1Id, receiverId: user2Id },
            { senderId: user2Id, receiverId: user1Id }
        ]
    }).sort({ timestamp: 1 });
};

// Método estático para marcar mensajes como leídos
mensajeAdminEntrenadorSchema.statics.markAsRead = async function(receiverId, senderId) {
    return this.updateMany(
        { receiverId, senderId, read: false },
        { $set: { read: true } }
    );
};

// Método estático para contar mensajes no leídos
mensajeAdminEntrenadorSchema.statics.countUnread = async function(receiverId, senderId) {
    return this.countDocuments({ receiverId, senderId, read: false });
};

const MensajeAdminEntrenador = mongoose.model('MensajeAdminEntrenador', mensajeAdminEntrenadorSchema);

module.exports = MensajeAdminEntrenador;
