/**
 * Script para el chat del entrenador con el administrador
 * Este script maneja la comunicación en tiempo real entre el entrenador y el administrador
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página del entrenador
    const chatAdminModal = document.getElementById('chatAdminModal');
    if (!chatAdminModal) return;

    console.log('Inicializando chat del entrenador con administrador...');
    
    // Elementos del DOM
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');
    const openChatBtn = document.getElementById('openChatModal');
    
    // Variables globales
    let socket;
    let adminId;
    let adminName = 'Administrador';
    
    // Obtener datos del usuario
    const userId = document.querySelector('meta[name="userId"]')?.content || '';
    const userName = document.querySelector('meta[name="userName"]')?.content || '';
    
    console.log('Datos del entrenador:', userId, userName);
    
    // Inicializar Socket.io inmediatamente al cargar la página
    // Esto asegura que pueda recibir mensajes incluso si no ha abierto el chat
    initializeSocket();
    
    // También mantener el evento de clic para cuando el usuario abra el chat
    if (openChatBtn) {
        openChatBtn.addEventListener('click', function() {
            console.log('Botón de chat clickeado');
            // Si por alguna razón el socket no se inició automáticamente, inicializarlo ahora
            if (!socket) {
                initializeSocket();
            }
            // Cargar mensajes al abrir el chat
            loadMessages();
        });
    }
    
    // Inicializar Socket.io
    function initializeSocket() {
        console.log('Inicializando Socket.io...');
        socket = io();
        
        socket.on('connect', function() {
            console.log('Conectado al servidor Socket.io');
            
            // Registrar al entrenador
            socket.emit('register-trainer', {
                trainerId: userId,
                trainerName: userName
            });
            
            // Obtener datos del admin
            socket.emit('get-admin-id');
            
            socket.on('admin-id', function(data) {
                adminId = data.adminId;
                console.log('ID del administrador obtenido:', adminId);
                
                // Cargar mensajes una vez que tengamos el ID del admin
                loadMessages();
            });
            
            // Obtener el administrador desde la API
            fetch('/chat-admin/api/admin-info')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        adminId = data.adminId;
                        adminName = `${data.nombre} ${data.apellido}`;
                        console.log('Datos del administrador obtenidos:', adminId, adminName);
                    }
                })
                .catch(err => console.error('Error al obtener datos del admin:', err));
        });
        
        // Recibir mensajes (evento principal) - Formato principal
        socket.on(`admin-trainer-chat-${userId}`, function(message) {
            console.log('Mensaje recibido en entrenador (formato principal):', message);
            procesarMensajeRecibido(message);
        });
        
        // Recibir mensajes (formato alternativo 1 - sala directa)
        socket.on(`trainer-${userId}`, function(message) {
            console.log('Mensaje recibido en entrenador (sala directa):', message);
            procesarMensajeRecibido(message);
        });
        
        // Recibir mensajes (formato alternativo 2 - mensaje general)
        socket.on('chat-message', function(message) {
            console.log('Mensaje recibido en entrenador (mensaje general):', message);
            // Solo procesar si este mensaje es para este entrenador
            if (message.receiverId === userId) {
                procesarMensajeRecibido(message);
            }
        });
        
        // Recibir mensajes (formato nuevo para entrenadores)
        socket.on('mensaje-entrenador', function(data) {
            console.log('Mensaje para entrenador recibido:', data);
            // Verificar si este mensaje es para este entrenador
            if (data.receiverId === userId) {
                console.log('Mensaje es para este entrenador, procesando...');
                procesarMensajeRecibido(data.mensaje);
                
                // Reproducir sonido de notificación
                try {
                    const audio = new Audio('/sounds/notification.mp3');
                    audio.volume = 0.5;
                    audio.play();
                } catch (error) {
                    console.log('No se pudo reproducir sonido de notificación');
                }
                
                // Mostrar notificación del navegador
                if (Notification && Notification.permission === 'granted') {
                    new Notification('Nuevo mensaje del administrador', {
                        body: data.mensaje.message.substring(0, 50) + (data.mensaje.message.length > 50 ? '...' : ''),
                        icon: '/img/logo.png'
                    });
                }
            }
        });
        
        // Función para procesar mensajes recibidos
        function procesarMensajeRecibido(message) {
            // Evitar duplicados verificando si ya existe este mensaje en el chat
            if (document.querySelector(`[data-message-id="${message._id}"]`)) {
                console.log('Mensaje duplicado, ignorando:', message._id);
                return;
            }
            
            addMessageToChat(message);
            
            // Reproducir sonido de notificación si el mensaje es del administrador
            if (message.senderId !== userId) {
                try {
                    const audio = new Audio('/sounds/notification.mp3');
                    audio.volume = 0.5;
                    audio.play();
                } catch (error) {
                    console.log('No se pudo reproducir sonido de notificación');
                }
                
                // Mostrar notificación del navegador si está permitido
                if (Notification && Notification.permission === 'granted') {
                    try {
                        new Notification('Nuevo mensaje del administrador', {
                            body: message.message.substring(0, 50) + (message.message.length > 50 ? '...' : ''),
                            icon: '/img/logo.png'
                        });
                    } catch (error) {
                        console.log('Error al mostrar notificación:', error);
                    }
                }
                
                // Marcar como leído
                socket.emit('mark-messages-read', {
                    userId: userId,
                    senderId: message.senderId
                });
            }
        }
        
        // Recibir confirmación de mensaje enviado
        socket.on(`mensaje-enviado-${userId}`, function(data) {
            console.log('Confirmación de mensaje enviado:', data);
            if (data.success) {
                console.log('Mensaje enviado exitosamente con ID:', data.messageId);
            }
        });
        
        // Escuchar indicador de escritura
        socket.on('admin-writing', function(data) {
            if (data.trainerId === userId) {
                if (typingIndicator) {
                    typingIndicator.textContent = `${adminName} está escribiendo...`;
                    typingIndicator.style.display = 'block';
                    
                    setTimeout(() => {
                        typingIndicator.style.display = 'none';
                    }, 3000);
                }
            }
        });
    }
    
    // Cargar mensajes anteriores
    function loadMessages() {
        if (!chatMessages) return;
        
        chatMessages.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><p class="mt-2 text-muted">Cargando mensajes...</p></div>';
        
        // Usar API para obtener mensajes
        const apiUrl = adminId 
            ? `/chat-admin/api/mensajes/${adminId}/${userId}`
            : '/chat-admin/api/admin-info';
            
        console.log('Cargando mensajes desde:', apiUrl);
        
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Si obtenemos la info del admin primero
                    if (data.adminId) {
                        adminId = data.adminId;
                        adminName = `${data.nombre} ${data.apellido}`;
                        console.log('Datos del administrador obtenidos:', adminId, adminName);
                        
                        // Ahora cargar los mensajes
                        return fetch(`/chat-admin/api/mensajes/${adminId}/${userId}`);
                    }
                    
                    // Si ya tenemos los mensajes
                    renderMessages(data.mensajes);
                    return null;
                } else {
                    throw new Error('No se pudo obtener la información necesaria');
                }
            })
            .then(response => response ? response.json() : null)
            .then(data => {
                if (data && data.success) {
                    renderMessages(data.mensajes);
                }
            })
            .catch(error => {
                console.error('Error al cargar mensajes:', error);
                if (chatMessages) {
                    chatMessages.innerHTML = '<p class="text-center text-danger my-4">Error al cargar mensajes. Inténtalo de nuevo.</p>';
                }
            });
    }
    
    // Renderizar mensajes
    function renderMessages(messages) {
        if (!chatMessages) return;
        
        chatMessages.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            chatMessages.innerHTML = '<p class="text-center text-muted my-4">No hay mensajes anteriores. Comienza la conversación.</p>';
            return;
        }
        
        messages.forEach(message => {
            addMessageToChat(message);
        });
        }
    }
    
    // Enviar mensaje
    function sendMessage() {
        if (!messageInput || !socket || !adminId) return;
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        console.log('Enviando mensaje al administrador:', message);
        
        const messageData = {
            senderId: userId,
            senderName: userName,
            senderType: 'entrenador',
            receiverId: adminId,
            receiverName: adminName,
            receiverType: 'administrador',
            message: message,
            timestamp: new Date()
        };
        
        // Enviar mensaje a través de Socket.io
        socket.emit('admin-trainer-message', messageData);
        
        // Limpiar input
        messageInput.value = '';
        
        // Agregar mensaje al chat localmente
        addMessageToChat(messageData);
    }
    
    // Manejadores de eventos
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Indicador de escritura
        messageInput.addEventListener('input', function() {
            if (socket && adminId) {
                socket.emit('trainer-writing', {
                    trainerId: userId,
                    trainerName: userName,
                    adminId: adminId
                });
            }
        });
    }
    
    // Inicializar socket inmediatamente si ya está abierto el modal
    if (chatAdminModal.classList.contains('show')) {
        initializeSocket();
        loadMessages();
    }
});
