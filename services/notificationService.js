const Message = require('../models/Message');
const Cliente = require('../models/Cliente');
const Entrenador = require('../models/Entrenador');

class NotificationService {
    constructor() {
        this.notifications = {}; // Almacena notificaciones por usuario: { userId: [notifications] }
    }

    // Añadir una nueva notificación
    async addNotification(userId, notification) {
        if (!this.notifications[userId]) {
            this.notifications[userId] = [];
        }
        
        // Añadir timestamp si no existe
        if (!notification.timestamp) {
            notification.timestamp = new Date();
        }
        
        // Añadir id único a la notificación
        notification.id = Date.now() + Math.floor(Math.random() * 1000);
        
        this.notifications[userId].push(notification);
        
        // Limitar a 50 notificaciones por usuario
        if (this.notifications[userId].length > 50) {
            this.notifications[userId] = this.notifications[userId].slice(-50);
        }
        
        return notification;
    }

    // Obtener notificaciones para un usuario
    getNotifications(userId) {
        return this.notifications[userId] || [];
    }

    // Marcar notificaciones como leídas
    markAsRead(userId, notificationIds) {
        if (!this.notifications[userId]) return;
        
        this.notifications[userId] = this.notifications[userId].map(notification => {
            if (notificationIds.includes(notification.id)) {
                return { ...notification, read: true };
            }
            return notification;
        });
    }

    // Crear notificación de nuevo mensaje
    async createMessageNotification(message) {
        try {
            // Determinar el tipo de remitente (cliente o entrenador)
            let senderName = "Usuario";
            let senderType = "";
            
            // Buscar si el remitente es un cliente
            const clienteSender = await Cliente.findOne({ 'usuarioId': message.senderId }).populate('usuarioId');
            if (clienteSender && clienteSender.usuarioId) {
                senderName = `${clienteSender.usuarioId.nombre} ${clienteSender.usuarioId.apellido}`;
                senderType = "cliente";
            } else {
                // Buscar si el remitente es un entrenador
                const entrenadorSender = await Entrenador.findOne({ 'usuarioId': message.senderId }).populate('usuarioId');
                if (entrenadorSender && entrenadorSender.usuarioId) {
                    senderName = `${entrenadorSender.usuarioId.nombre} ${entrenadorSender.usuarioId.apellido}`;
                    senderType = "entrenador";
                }
            }
            
            // Crear notificación para el destinatario
            const notification = {
                type: 'message',
                title: 'Nuevo mensaje',
                message: `${senderName} te ha enviado un mensaje`,
                senderName,
                senderType,
                senderId: message.senderId,
                content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
                timestamp: message.timestamp || new Date(),
                read: false,
                chatUrl: senderType === 'cliente' 
                    ? `/chat/entrenador/${message.receiverId}/cliente/${message.senderId}`
                    : `/chat/cliente/${message.receiverId}`
            };
            
            return await this.addNotification(message.receiverId, notification);
        } catch (error) {
            console.error('Error al crear notificación de mensaje:', error);
            return null;
        }
    }

    // Contar notificaciones no leídas
    countUnread(userId) {
        if (!this.notifications[userId]) return 0;
        return this.notifications[userId].filter(notification => !notification.read).length;
    }

    // Eliminar notificaciones
    removeNotifications(userId, notificationIds) {
        if (!this.notifications[userId]) return;
        
        this.notifications[userId] = this.notifications[userId].filter(
            notification => !notificationIds.includes(notification.id)
        );
    }
}

module.exports = NotificationService;
