const MessageService = require('./services/messageService');
const NotificationService = require('./services/notificationService');
const messageService = new MessageService();
const notificationService = new NotificationService();

// Importar modelo para mensajes entre administrador y entrenador
const MensajeAdminEntrenador = require('./models/MensajeAdminEntrenador');

// Map para almacenar la relación de usuarios conectados con sus sockets
const userSockets = new Map();
const adminSockets = new Map();
const trainerSockets = new Map();

module.exports = (io) => {
    io.on('connection', async (socket) => {
        console.log("un nuevo usuario conectado");
        const messages = await messageService.getAll();
        io.emit('all-messages', messages);
        
        // Registrar administrador
        socket.on('register-admin', (data) => {
            console.log('Administrador registrado:', data.adminId);
            console.log('Socket ID del admin:', socket.id);
            
            // Guardar en el mapa y en el objeto socket
            adminSockets.set(data.adminId, socket.id);
            socket.adminId = data.adminId;
            socket.userType = 'administrador';
            
            // Unirse a una sala personal
            socket.join(`admin-${data.adminId}`);
            console.log(`Admin unido a sala: admin-${data.adminId}`);
            
            // Informar a los entrenadores que el administrador está en línea
            io.emit('admin-status-change', { adminId: data.adminId, online: true });
            
            // Mostrar todos los administradores conectados
            console.log('Admins conectados:', Array.from(adminSockets.entries()));
        });
        
        // Registrar entrenador
        socket.on('register-trainer', (data) => {
            console.log('Entrenador registrado:', data.trainerId);
            console.log('Socket ID del entrenador:', socket.id);
            console.log('Datos recibidos del entrenador:', JSON.stringify(data));
            
            // Guardar en el mapa y en el objeto socket
            trainerSockets.set(data.trainerId, socket.id);
            socket.trainerId = data.trainerId;
            socket.userType = 'entrenador';
            
            // Guardar nombre si está disponible
            if (data.trainerName) {
                socket.trainerName = data.trainerName;
            }
            
            // Unirse a una sala personal
            socket.join(`trainer-${data.trainerId}`);
            console.log(`Entrenador unido a sala: trainer-${data.trainerId}`);
            
            // Informar al administrador que el entrenador está en línea
            io.emit('trainer-status-change', { trainerId: data.trainerId, online: true });
            
            // Mostrar todos los entrenadores conectados
            console.log('Entrenadores conectados:', Array.from(trainerSockets.entries()));
        });
        
        // Obtener ID del administrador
        socket.on('get-admin-id', async () => {
            try {
                // Buscar un administrador en la base de datos
                const Usuario = require('./models/Usuario');
                const admin = await Usuario.findOne({ tipoUsuario: 'administrador' });
                
                if (admin) {
                    socket.emit('admin-id', { adminId: admin._id.toString() });
                }
            } catch (error) {
                console.error('Error al obtener ID de administrador:', error);
            }
        });
        
        // Unirse a un chat entre administrador y entrenador
        socket.on('join-admin-trainer-chat', (data) => {
            const { adminId, trainerId } = data;
            console.log(`Uniendo al chat entre admin ${adminId} y entrenador ${trainerId}`);
            
            // Crear una sala para este chat específico
            const chatRoom = `admin-trainer-${adminId}-${trainerId}`;
            socket.join(chatRoom);
        });
        
        // Obtener conversación entre administrador y entrenador
        socket.on('get-admin-trainer-conversation', async (data) => {
            try {
                const { adminId, trainerId } = data;
                
                if (!adminId || !trainerId) {
                    console.error('IDs de administrador o entrenador no proporcionados');
                    return;
                }
                
                // Obtener mensajes de la base de datos
                const mensajes = await MensajeAdminEntrenador.getConversation(adminId, trainerId);
                
                // Enviar mensajes al solicitante
                socket.emit('admin-trainer-conversation', { mensajes });
                
                // Marcar mensajes como leídos si el solicitante es el receptor
                if (socket.adminId === adminId) {
                    await MensajeAdminEntrenador.markAsRead(adminId, trainerId);
                } else if (socket.trainerId === trainerId) {
                    await MensajeAdminEntrenador.markAsRead(trainerId, adminId);
                }
            } catch (error) {
                console.error('Error al obtener conversación admin-entrenador:', error);
            }
        });
        
        // Mensaje entre administrador y entrenador
        socket.on('admin-trainer-message', async (data) => {
            try {
                console.log('========== NUEVO MENSAJE ==========');
                console.log('Mensaje admin-entrenador recibido:', JSON.stringify(data, null, 2));
                console.log('Socket ID del remitente:', socket.id);
                console.log('Conexiones activas: Admin:', adminSockets.size, 'Entrenadores:', trainerSockets.size);
                console.log('Admins conectados:', Array.from(adminSockets.entries()));
                console.log('Entrenadores conectados:', Array.from(trainerSockets.entries()));
                
                // Verificar que el mensaje tenga todos los campos requeridos
                if (!data.senderId || !data.receiverId || !data.message || !data.senderType || !data.receiverType) {
                    console.error('Error: Mensaje incompleto', data);
                    return;
                }
                
                // Guardar mensaje en la base de datos
                const mensaje = new MensajeAdminEntrenador(data);
                const savedMessage = await mensaje.save();
                
                // Registrar en la consola para depuración
                console.log('Mensaje guardado en la BD:', savedMessage._id);
                console.log('Sender:', data.senderType, data.senderId);
                console.log('Receiver:', data.receiverType, data.receiverId);
                
                // Método de envío principal para asegurar la entrega
                io.emit('chat-message', savedMessage);
                
                // Si el remitente es un administrador (mensaje a entrenador)
                if (data.senderType === 'administrador') {
                    const entrenadorSocketId = trainerSockets.get(data.receiverId);
                    console.log(`Enviando mensaje a entrenador ${data.receiverId}, Socket ID: ${entrenadorSocketId}`);
                    
                    // Método 1: Envío directo al socket del entrenador (más específico)
                    if (entrenadorSocketId) {
                        console.log(`Envío directo al socket del entrenador: ${entrenadorSocketId}`);
                        io.to(entrenadorSocketId).emit(`admin-trainer-chat-${data.receiverId}`, savedMessage);
                    }
                    
                    // Método 2: Envío a la sala del entrenador
                    console.log(`Envío a la sala del entrenador: trainer-${data.receiverId}`);
                    io.to(`trainer-${data.receiverId}`).emit(`admin-trainer-chat-${data.receiverId}`, savedMessage);
                    
                    // Método 3: Envío para todos los entrenadores (filtrado por ID en el cliente)
                    // Cada cliente verificará si el mensaje es para él
                    console.log('Envío global filtrado en el cliente');
                    io.emit('mensaje-entrenador', {
                        mensaje: savedMessage,
                        receiverId: data.receiverId,
                        // Asegurar que se use el nombre correcto del remitente
                        nombreUsuario: data.senderName || 'Administrador'
                    });
                    
                    // Confirmación en log
                    console.log(`Mensaje enviado a entrenador ${data.receiverId}: ${data.message.substring(0, 20)}...`);
                }
                
                // Si el remitente es un entrenador (mensaje a administrador)
                if (data.senderType === 'entrenador') {
                    const adminSocketId = adminSockets.get(data.receiverId);
                    console.log(`Enviando mensaje a administrador ${data.receiverId}, Socket ID: ${adminSocketId}`);
                    
                    // Método 1: Envío directo al socket del administrador
                    if (adminSocketId) {
                        console.log(`Envío directo al socket del administrador: ${adminSocketId}`);
                        io.to(adminSocketId).emit(`admin-trainer-chat-${data.receiverId}`, savedMessage);
                    }
                    
                    // Método 2: Envío a la sala del administrador
                    console.log(`Envío a la sala del administrador: admin-${data.receiverId}`);
                    io.to(`admin-${data.receiverId}`).emit(`admin-trainer-chat-${data.receiverId}`, savedMessage);
                    
                    // Método 3: Envío global filtrado en el cliente
                    console.log('Envío global filtrado en el cliente');
                    io.emit('mensaje-admin', {
                        mensaje: savedMessage,
                        receiverId: data.receiverId,
                        // Asegurar que se use el nombre correcto del remitente
                        nombreUsuario: data.senderName || 'Entrenador'
                    });
                    
                    // Confirmación en log
                    console.log(`Mensaje enviado a administrador ${data.receiverId}: ${data.message.substring(0, 20)}...`);
                }
                
                // Enviar confirmación al remitente
                socket.emit(`mensaje-enviado-${data.senderId}`, {
                    success: true,
                    messageId: savedMessage._id,
                    message: savedMessage
                });
                
                // También enviar el mensaje de vuelta al remitente para que pueda ver su propio mensaje
                socket.emit(`admin-trainer-chat-${data.senderId}`, savedMessage);
                
                console.log('========== FIN MENSAJE ==========');
                console.log(`Mensaje de ${data.senderType} a ${data.receiverType} enviado exitosamente`);
            } catch (error) {
                console.error('Error al procesar mensaje admin-entrenador:', error);
            }
        });
        
        // Indicador de escritura del administrador
        socket.on('admin-writing', (data) => {
            const { adminId, trainerId } = data;
            const trainerSocketId = trainerSockets.get(trainerId);
            
            if (trainerSocketId) {
                io.to(trainerSocketId).emit('admin-writing', data);
            }
        });
        
        // Indicador de escritura del entrenador
        socket.on('trainer-writing', (data) => {
            const { trainerId, trainerName } = data;
            io.emit('trainer-writing', { trainerId, trainerName });
        });
        
        // Marcar mensajes de administrador como leídos
        socket.on('mark-admin-message-read', async (data) => {
            try {
                const { trainerId, adminId, messageId } = data;
                
                if (messageId) {
                    // Marcar un mensaje específico como leído
                    await MensajeAdminEntrenador.updateOne(
                        { _id: messageId },
                        { $set: { read: true } }
                    );
                } else {
                    // Marcar todos los mensajes del admin al entrenador como leídos
                    await MensajeAdminEntrenador.markAsRead(trainerId, adminId);
                }
            } catch (error) {
                console.error('Error al marcar mensajes como leídos:', error);
            }
        });

        socket.on('writing', (username) => {
            socket.broadcast.emit('writing', username);
        });

        socket.on('new-message', async (data) => {
            await messageService.create(data);
            const messages = await messageService.getAll();
            io.emit('all-messages', messages);
        });

        // Manejar mensajes privados entre entrenador y cliente
        socket.on('private-message', async (data) => {
            try {
                console.log('Mensaje privado recibido:', data);
                
                // Guardar mensaje en la base de datos
                const savedMessage = await messageService.create(data);
                console.log('Mensaje guardado en la base de datos:', savedMessage);
                
                // Emitir el mensaje solo al remitente y al destinatario
                io.emit(`chat-${data.senderId}-${data.receiverId}`, data);
                io.emit(`chat-${data.receiverId}-${data.senderId}`, data);
                console.log(`Mensaje emitido a los canales chat-${data.senderId}-${data.receiverId} y chat-${data.receiverId}-${data.senderId}`);
                
                // Crear notificación para el destinatario
                console.log('Creando notificación para:', data.receiverId);
                const notification = await notificationService.createMessageNotification(data);
                console.log('Notificación creada:', notification);
                
                // Forzar la creación de una notificación si no se creó automáticamente
                if (!notification) {
                    console.log('Creando notificación manual ya que no se creó automáticamente');
                    const manualNotification = {
                        type: 'message',
                        title: 'Nuevo mensaje',
                        message: `Has recibido un nuevo mensaje`,
                        senderName: data.username || 'Usuario',
                        senderType: data.senderType || 'usuario',
                        senderId: data.senderId,
                        content: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : ''),
                        timestamp: data.timestamp || new Date(),
                        read: false,
                        id: Date.now() + Math.floor(Math.random() * 1000)
                    };
                    
                    // Emitir notificación al destinatario
                    io.emit(`notifications-${data.receiverId}`, manualNotification);
                    console.log(`Notificación manual emitida al canal notifications-${data.receiverId}`);
                    
                    // Incrementar contador de notificaciones no leídas
                    await notificationService.addNotification(data.receiverId, manualNotification);
                    const unreadCount = await notificationService.countUnread(data.receiverId);
                    io.emit(`unread-count-${data.receiverId}`, { count: unreadCount + 1 });
                    console.log(`Contador de notificaciones no leídas emitido: ${unreadCount + 1}`);
                } else {
                    // Emitir notificación al destinatario
                    io.emit(`notifications-${data.receiverId}`, notification);
                    console.log(`Notificación emitida al canal notifications-${data.receiverId}`);
                    
                    // Emitir contador de notificaciones no leídas
                    const unreadCount = await notificationService.countUnread(data.receiverId);
                    io.emit(`unread-count-${data.receiverId}`, { count: unreadCount });
                    console.log(`Contador de notificaciones no leídas emitido: ${unreadCount}`);
                }
                
                // Actualizar la lista de conversaciones para ambos usuarios
                const senderConversations = await messageService.getConversationsForUser(data.senderId);
                const receiverConversations = await messageService.getConversationsForUser(data.receiverId);
                
                io.emit(`conversations-${data.senderId}`, senderConversations);
                io.emit(`conversations-${data.receiverId}`, receiverConversations);
            } catch (error) {
                console.error('Error al enviar mensaje privado:', error);
            }
        });

        // Obtener conversación entre dos usuarios
        socket.on('get-conversation', async (data) => {
            try {
                const { user1Id, user2Id } = data;
                const conversation = await messageService.getConversation(user1Id, user2Id);
                socket.emit(`conversation-${user1Id}-${user2Id}`, conversation);
            } catch (error) {
                console.error('Error al obtener conversación:', error);
            }
        });

        // Obtener notificaciones para un usuario
        socket.on('get-notifications', async (data) => {
            try {
                const { userId } = data;
                const notifications = await notificationService.getNotifications(userId);
                socket.emit(`all-notifications-${userId}`, notifications);
                
                // Enviar también el contador de no leídas
                const unreadCount = await notificationService.countUnread(userId);
                socket.emit(`unread-count-${userId}`, { count: unreadCount });
            } catch (error) {
                console.error('Error al obtener notificaciones:', error);
            }
        });

        // Marcar notificaciones como leídas
        socket.on('mark-notifications-read', async (data) => {
            try {
                const { userId, notificationIds, senderId } = data;
                
                // Si se proporciona un senderId, marcar solo las notificaciones de ese remitente
                if (senderId) {
                    console.log(`Marcando como leídas las notificaciones de ${senderId} para ${userId}`);
                    
                    // Obtener todas las notificaciones del usuario
                    const allNotifications = await notificationService.getNotifications(userId);
                    
                    // Filtrar por remitente
                    const senderNotifications = allNotifications.filter(n => 
                        n.senderId === senderId && !n.read
                    );
                    
                    // Obtener los IDs
                    const idsToMark = senderNotifications.map(n => n.id);
                    
                    if (idsToMark.length > 0) {
                        await notificationService.markAsRead(userId, idsToMark);
                        console.log(`${idsToMark.length} notificaciones marcadas como leídas`);
                    }
                } else {
                    // Comportamiento original: marcar las notificaciones especificadas o todas si no se especifican
                    await notificationService.markAsRead(userId, notificationIds);
                }
                
                // Enviar notificaciones actualizadas
                const notifications = await notificationService.getNotifications(userId);
                socket.emit(`all-notifications-${userId}`, notifications);
                
                // Actualizar contador de no leídas
                const unreadCount = await notificationService.countUnread(userId);
                socket.emit(`unread-count-${userId}`, { count: unreadCount });
            } catch (error) {
                console.error('Error al marcar notificaciones como leídas:', error);
            }
        });

        // Eliminar notificaciones
        socket.on('remove-notifications', async (data) => {
            try {
                const { userId, notificationIds } = data;
                await notificationService.removeNotifications(userId, notificationIds);
                
                // Enviar notificaciones actualizadas
                const notifications = await notificationService.getNotifications(userId);
                socket.emit(`all-notifications-${userId}`, notifications);
            } catch (error) {
                console.error('Error al eliminar notificaciones:', error);
            }
        });
        
        // Evento de desconexión
        socket.on('disconnect', () => {
            console.log('Usuario desconectado');
            
            // Si era un administrador
            if (socket.adminId) {
                adminSockets.delete(socket.adminId);
                io.emit('admin-status-change', { adminId: socket.adminId, online: false });
                console.log(`Administrador ${socket.adminId} desconectado`);
            }
            
            // Si era un entrenador
            if (socket.trainerId) {
                trainerSockets.delete(socket.trainerId);
                io.emit('trainer-status-change', { trainerId: socket.trainerId, online: false });
                console.log(`Entrenador ${socket.trainerId} desconectado`);
            }
        });

        // Verificar mensajes no leídos entre dos usuarios
        socket.on('check-unread-messages', async (data) => {
            try {
                const { senderId, receiverId } = data;
                console.log(`Verificando mensajes no leídos de ${senderId} a ${receiverId}`);
                
                // Obtener todas las notificaciones del receptor
                const notifications = await notificationService.getNotifications(receiverId);
                
                // Filtrar solo las notificaciones de tipo mensaje del remitente específico
                const unreadMessages = notifications.filter(notif => 
                    notif.type === 'message' && 
                    notif.senderId === senderId && 
                    !notif.read
                );
                
                const count = unreadMessages.length;
                console.log(`${count} mensajes no leídos de ${senderId} a ${receiverId}`);
                
                // Emitir el contador al socket
                io.emit('unread-messages-count', { 
                    senderId, 
                    receiverId, 
                    count 
                });
            } catch (error) {
                console.error('Error al verificar mensajes no leídos:', error);
            }
        });
        
        // Reiniciar contador de mensajes no leídos entre dos usuarios
        socket.on('reset-unread-count', async (data) => {
            try {
                const { senderId, receiverId } = data;
                console.log(`Reiniciando contador de mensajes no leídos de ${senderId} a ${receiverId}`);
                
                // Obtener todas las notificaciones del receptor
                const notifications = await notificationService.getNotifications(receiverId);
                
                // Filtrar solo las notificaciones de tipo mensaje del remitente específico
                const messageNotifications = notifications.filter(notif => 
                    notif.type === 'message' && 
                    notif.senderId === senderId
                );
                
                // Obtener los IDs de las notificaciones
                const notificationIds = messageNotifications.map(notif => notif.id);
                
                // Marcar como leídas
                if (notificationIds.length > 0) {
                    await notificationService.markAsRead(receiverId, notificationIds);
                    console.log(`${notificationIds.length} notificaciones marcadas como leídas`);
                }
                
                // Emitir el contador actualizado (0) al socket
                io.emit('unread-messages-count', { 
                    senderId, 
                    receiverId, 
                    count: 0 
                });
                
                // Actualizar también el contador general de notificaciones
                const unreadCount = await notificationService.countUnread(receiverId);
                io.emit(`unread-count-${receiverId}`, { count: unreadCount });
            } catch (error) {
                console.error('Error al reiniciar contador de mensajes no leídos:', error);
            }
        });
    });
    
    // Función para enviar mensaje de bienvenida cuando un usuario se conecta por primera vez
    async function sendWelcomeMessage(userId, userType) {
        try {
            // Buscar si ya existen mensajes para este usuario
            const Usuario = require('./models/Usuario');
            const admin = await Usuario.findOne({ tipoUsuario: 'administrador' });
            
            if (!admin) return;
            
            const existingMessages = await MensajeAdminEntrenador.countDocuments({
                $or: [
                    { senderId: userId, receiverId: admin._id.toString() },
                    { senderId: admin._id.toString(), receiverId: userId }
                ]
            });
            
            // Si no hay mensajes previos, enviar mensaje de bienvenida
            if (existingMessages === 0 && userType === 'entrenador') {
                const welcomeMessage = {
                    senderId: admin._id.toString(),
                    senderName: admin.nombre + ' ' + admin.apellido,
                    senderType: 'administrador',
                    receiverId: userId,
                    receiverType: 'entrenador',
                    message: '¡Bienvenido al sistema de chat! Aquí podrás comunicarte directamente con el administrador para cualquier consulta o asistencia que necesites.',
                    timestamp: new Date(),
                    read: false
                };
                
                const mensaje = new MensajeAdminEntrenador(welcomeMessage);
                await mensaje.save();
                
                // Emitir mensaje al entrenador si está conectado
                const trainerSocketId = trainerSockets.get(userId);
                if (trainerSocketId) {
                    io.to(trainerSocketId).emit(`admin-trainer-chat-${userId}`, welcomeMessage);
                }
            }
        } catch (error) {
            console.error('Error al enviar mensaje de bienvenida:', error);
        }
    }
};
