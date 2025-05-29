// Script para el chat integrado en el dashboard del administrador
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en el dashboard del administrador
    const chatTrainersTab = document.getElementById('chat-trainers');
    if (!chatTrainersTab) return;

    // Elementos del DOM
    const trainersListChat = document.getElementById('trainersListChat');
    const searchTrainerChat = document.getElementById('searchTrainerChat');
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatHeader = document.getElementById('chatHeader');
    const noTrainerSelected = document.getElementById('noTrainerSelected');
    const activeChatArea = document.getElementById('activeChatArea');

    // Variables globales
    let currentTrainerId = null;
    let currentTrainerName = null;
    let adminId = null;
    let adminName = null;
    let socket = null;
    let adminRole = 'administrador';

    // Inicializar Socket.io
    function initializeSocket() {
        if (socket) return; // Si ya está inicializado, no hacer nada

        socket = io();
        
        // Evento de conexión
        socket.on('connect', function() {
            console.log('Conectado al servidor Socket.io');
            
            // Registrar al administrador
            if (adminId) {
                socket.emit('register-admin', {
                    adminId: adminId,
                    adminName: adminName
                });
                console.log('Administrador registrado:', adminId);
            }
        });
        
        // Recibir mensaje del entrenador o confirmación de mensaje enviado
        socket.on(`admin-trainer-chat-${adminId}`, function(message) {
            console.log('Mensaje recibido en admin:', message);
            
            // Si el mensaje es de un entrenador (no del admin mismo)
            if (message.senderType === 'entrenador') {
                // Si el mensaje es del entrenador con el que estamos chateando actualmente
                if (currentTrainerId === message.senderId) {
                    addMessageToChat(message);
                    
                    // Reproducir sonido de notificación
                    try {
                        const audio = new Audio('/sounds/notification.mp3');
                        audio.volume = 0.5;
                        audio.play();
                    } catch (error) {
                        console.log('No se pudo reproducir sonido de notificación');
                    }
                    
                    // Marcar como leído
                    socket.emit('mark-messages-read', {
                        userId: adminId,
                        senderId: message.senderId
                    });
                } else {
                    // Incrementar contador de mensajes no leídos
                    const trainerItem = document.querySelector(`.user-item[data-id="${message.senderId}"]`);
                    if (trainerItem) {
                        const unreadBadge = trainerItem.querySelector('.unread-count');
                        if (unreadBadge) {
                            unreadBadge.style.display = 'block';
                            const badgeCount = unreadBadge.querySelector('.badge');
                            if (badgeCount) {
                                const currentCount = parseInt(badgeCount.textContent || '0');
                                badgeCount.textContent = currentCount + 1;
                            }
                        }
                    }
                    
                    // Mostrar notificación en el navegador
                    try {
                        if (Notification && Notification.permission === 'granted') {
                            new Notification('Nuevo mensaje de entrenador', {
                                body: `${message.senderName}: ${message.message.substring(0, 30)}...`,
                                icon: '/img/logo.png'
                            });
                        }
                    } catch (error) {
                        console.log('No se pudo mostrar notificación del navegador');
                    }
                }
            } else if (message.senderType === 'administrador' && message.senderId === adminId) {
                // Si es un mensaje propio (enviado por el mismo admin)
                if (currentTrainerId === message.receiverId) {
                    addMessageToChat(message);
                }
            }
        });
        
        // Recibir confirmación de mensaje enviado
        socket.on(`mensaje-enviado-${adminId}`, function(data) {
            console.log('Confirmación de mensaje enviado:', data);
            if (data.success) {
                console.log('Mensaje enviado exitosamente con ID:', data.messageId);
            }
        });
        
        // Actualizar estado online de entrenadores
        socket.on('trainer-status-change', function(data) {
            const trainerItem = document.querySelector(`.user-item[data-id="${data.trainerId}"]`);
            if (trainerItem) {
                const statusIndicator = trainerItem.querySelector('.online-indicator');
                if (statusIndicator) {
                    statusIndicator.className = `online-indicator ${data.online ? 'online' : 'offline'}`;
                }
            }
        });
        
        // Escuchar indicador de escritura del entrenador
        socket.on('trainer-writing', function(data) {
            if (currentTrainerId === data.trainerId) {
                const typingIndicator = document.getElementById('typingIndicator');
                if (typingIndicator) {
                    typingIndicator.textContent = `${data.trainerName} está escribiendo...`;
                    typingIndicator.style.display = 'block';
                    
                    // Ocultar después de 3 segundos
                    setTimeout(() => {
                        typingIndicator.style.display = 'none';
                    }, 3000);
                }
            }
        });
    }

    // Obtener datos del usuario administrador actual
    function getCurrentAdminData() {
        fetch('/api/usuario-actual')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.usuario) {
                    adminId = data.usuario._id;
                    adminName = `${data.usuario.nombre} ${data.usuario.apellido}`;
                    adminRole = 'administrador'; // Definir el rol del administrador
                    console.log('Datos del administrador obtenidos:', adminId, adminName, adminRole);
                    
                    // Inicializar Socket.io después de obtener los datos del usuario
                    initializeSocket();
                    
                    // Cargar entrenadores
                    loadTrainers();
                } else {
                    console.error('No se pudieron obtener los datos del usuario');
                }
            })
            .catch(error => {
                console.error('Error al obtener datos del usuario:', error);
            });
    }

    // Cargar entrenadores para el chat
    function loadTrainers() {
        console.log('Intentando cargar entrenadores...');
        trainersListChat.innerHTML = '<div class="text-center mt-4 text-white-50"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Cargando entrenadores...</p></div>';
        
        // Usar la nueva API dedicada para obtener entrenadores
        fetch('/api/get-entrenadores/all')
            .then(response => {
                console.log('Respuesta de API entrenadores:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Datos recibidos de API entrenadores:', data);
                if (data.success && data.entrenadores && data.entrenadores.length > 0) {
                    console.log(`Se encontraron ${data.entrenadores.length} entrenadores`); 
                    renderTrainers(data.entrenadores);
                } else {
                    console.log('La API no devolvió entrenadores, intentando APIs alternativas');
                    tryAlternativeAPIs();
                }
            })
            .catch(error => {
                console.error('Error al cargar entrenadores:', error);
                tryAlternativeAPIs();
            });
    }
    
    // Función de respaldo para intentar APIs alternativas
    function tryAlternativeAPIs() {
        const APIs = [
            '/chat-admin/api/entrenadores',
            '/api/admin/entrenadores',
            '/api/entrenadores'
        ];
        
        // Intentar cada API en secuencia
        Promise.all(APIs.map(url => 
            fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error(`API ${url} respondió con ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    console.log(`Datos de ${url}:`, data);
                    // Determinar dónde están los entrenadores en esta respuesta
                    if (data.success && data.entrenadores && data.entrenadores.length > 0) {
                        return { source: url, entrenadores: data.entrenadores };
                    } else if (data.success && data.data && data.data.length > 0) {
                        return { source: url, entrenadores: data.data };
                    } else if (Array.isArray(data) && data.length > 0) {
                        return { source: url, entrenadores: data };
                    }
                    return null;
                })
                .catch(e => {
                    console.log(`Error con ${url}:`, e.message);
                    return null;
                })
        )).then(results => {
            // Filtrar resultados válidos
            const validResults = results.filter(r => r !== null);
            
            if (validResults.length > 0) {
                // Usar el primer resultado válido
                const firstValid = validResults[0];
                console.log(`Usando entrenadores de ${firstValid.source}`);
                renderTrainers(firstValid.entrenadores);
            } else {
                // Si nada funcionó, mostrar mensaje de error
                console.error('No se pudieron cargar entrenadores de ninguna API');
                trainersListChat.innerHTML = '<div class="text-center my-4"><p class="text-white-50">No se encontraron entrenadores.</p><button id="retryLoadTrainers" class="btn btn-outline-light btn-sm mt-2">Intentar nuevamente</button></div>';
                
                // Agregar listener para reintentar
                document.getElementById('retryLoadTrainers')?.addEventListener('click', () => {
                    loadTrainers();
                });
            }
        });
    }

    // Renderizar lista de entrenadores
    function renderTrainers(trainers) {
        trainersListChat.innerHTML = '';
        
        if (trainers.length === 0) {
            trainersListChat.innerHTML = '<p class="text-center text-white-50">No se encontraron entrenadores.</p>';
            return;
        }
        
        trainers.forEach(trainer => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.dataset.id = trainer._id;
            userItem.style.cssText = 'display: flex; align-items: center; padding: 10px; border-radius: 8px; margin-bottom: 10px; transition: background-color 0.3s; cursor: pointer;';
            
            // Usar iniciales del entrenador para el avatar
            const initials = getInitials(trainer.nombre, trainer.apellido);
            
            userItem.innerHTML = `
                <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background-color: #0dcaf0; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold; font-size: 16px;">${initials}</div>
                <div class="user-info" style="flex: 1;">
                    <div class="user-name" style="font-weight: 600;">${trainer.nombre} ${trainer.apellido}</div>
                    <div class="user-status" style="font-size: 0.8rem; opacity: 0.8;">
                        <span>Entrenador</span>
                        <span class="online-indicator" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-left: 5px; background-color: #6c757d;"></span>
                    </div>
                </div>
                <div class="unread-count" style="display: none;">
                    <span class="badge bg-danger" style="border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">0</span>
                </div>
            `;
            
            userItem.addEventListener('click', () => selectTrainer(trainer));
            userItem.addEventListener('mouseover', () => {
                userItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            });
            userItem.addEventListener('mouseout', () => {
                if (currentTrainerId !== trainer._id) {
                    userItem.style.backgroundColor = '';
                }
            });
            
            trainersListChat.appendChild(userItem);
        });
    }

    // Obtener iniciales del nombre
    function getInitials(firstName, lastName) {
        const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
        return `${firstInitial}${lastInitial}`;
    }

    // Seleccionar un entrenador para chatear
    function selectTrainer(trainer) {
        console.log('Seleccionando entrenador:', trainer.nombre, trainer.apellido, trainer._id);
        
        // IMPORTANTE: Limpiar el chat antes de cambiar de entrenador
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        // Establecer el ID y nombre del entrenador actual
        currentTrainerId = trainer._id;
        window.currentTrainerId = trainer._id; // También actualizar variable global
        
        currentTrainerName = `${trainer.nombre} ${trainer.apellido}`;
        window.currentTrainerName = currentTrainerName; // También actualizar variable global
        
        console.log('Entrenador seleccionado - ID:', currentTrainerId, 'Nombre:', currentTrainerName);
        
        // Cambiar el estado de selección visual
        const trainerItems = document.querySelectorAll('.user-item');
        trainerItems.forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`.user-item[data-id="${trainer._id}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
            
            // Reiniciar contador de mensajes no leídos
            const unreadBadge = selectedItem.querySelector('.unread-count');
            if (unreadBadge) {
                unreadBadge.style.display = 'none';
                const badgeCount = unreadBadge.querySelector('.badge');
                if (badgeCount) {
                    badgeCount.textContent = '0';
                }
            }
        }
        
        // Ocultar el mensaje de "no hay entrenador seleccionado"
        if (noTrainerSelected) {
            noTrainerSelected.style.display = 'none';
        }
        // Cargar historial de mensajes
        loadChatHistory(adminId, trainer._id);
        
        // Indicar a Socket.io que se ha seleccionado un chat
        if (socket) {
            socket.emit('join-admin-trainer-chat', {
                adminId: adminId,
                trainerId: trainer._id
            });
            
            // Marcar mensajes como leídos
            socket.emit('mark-messages-read', {
                userId: adminId,
                senderId: trainer._id
            });
        }
    }

    // Cargar historial de chat
    function loadChatHistory(adminId, trainerId) {
        chatMessages.innerHTML = '<div class="text-center my-4"><i class="fas fa-spinner fa-spin"></i> Cargando mensajes...</div>';
        
        fetch(`/chat-admin/api/mensajes/${adminId}/${trainerId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.mensajes) {
                    renderMessages(data.mensajes);
                } else {
                    chatMessages.innerHTML = '<p class="text-center text-muted my-4">No hay mensajes anteriores.</p>';
                }
            })
            .catch(error => {
                console.error('Error al cargar historial de mensajes:', error);
                chatMessages.innerHTML = '<p class="text-center text-danger my-4">Error al cargar mensajes.</p>';
            });
    }

    // Renderizar mensajes
    function renderMessages(messages) {
        chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            chatMessages.innerHTML = '<p class="text-center text-muted my-4">No hay mensajes anteriores.</p>';
            return;
        }
        
        messages.forEach(message => {
            addMessageToChat(message);
        });
        
        // Scroll al final del chat
        scrollToBottom();
    }

    // Agregar un mensaje al chat
    function addMessageToChat(message) {
        const isOutgoing = message.senderId === adminId;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.style.cssText = `max-width: 70%; padding: 10px 15px; border-radius: 15px; position: relative; word-wrap: break-word; margin-bottom: 15px; align-self: ${isOutgoing ? 'flex-end' : 'flex-start'};`;
        
        // Estilo según si es enviado o recibido
        if (isOutgoing) {
            messageDiv.style.backgroundColor = '#dcf8c6';
            messageDiv.style.borderBottomRightRadius = '5px';
        } else {
            messageDiv.style.backgroundColor = '#f1f0f0';
            messageDiv.style.borderBottomLeftRadius = '5px';
        }
        
        // Formatear hora
        const messageTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = message.message;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'message-info';
        infoDiv.style.cssText = 'font-size: 0.75rem; color: #666; margin-top: 5px; display: flex; justify-content: space-between;';
        
        const senderSpan = document.createElement('span');
        senderSpan.textContent = isOutgoing ? 'Tú' : currentTrainerName || 'Entrenador';
        
        const timeSpan = document.createElement('span');
        timeSpan.textContent = messageTime;
        
        infoDiv.appendChild(senderSpan);
        infoDiv.appendChild(timeSpan);
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(infoDiv);
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Desplazar al final del chat
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Enviar mensaje
    function sendMessage() {
        console.log('Función sendMessage ejecutada');
        
        if (!messageInput) {
            console.error('Error: messageInput no encontrado');
            return;
        }
        
        const message = messageInput.value.trim();
        console.log('Mensaje a enviar:', message);
        
        if (!message) {
            console.log('Mensaje vacío, no se enviará');
            return;
        }
        
        // Usar variable global window.currentTrainerId si está disponible o usar la variable local como respaldo
        const trainerId = window.currentTrainerId || currentTrainerId;
        const trainerName = window.currentTrainerName || currentTrainerName;
        
        console.log('Verificando ID de entrenador:');
        console.log('- window.currentTrainerId:', window.currentTrainerId);
        console.log('- variable local currentTrainerId:', currentTrainerId);
        console.log('- ID a usar:', trainerId);
        
        if (!trainerId) {
            alert('Por favor, selecciona un entrenador antes de enviar un mensaje.');
            console.error('Error: No hay entrenador seleccionado');
            return;
        }
        
        if (!socket) {
            console.error('Error: Socket no inicializado');
            // Intentar reconectar el socket
            initializeSocket();
            return;
        }
        
        console.log('Preparando datos para enviar mensaje...');
        console.log('Admin ID:', adminId, 'Entrenador ID:', trainerId);
        
        const messageData = {
            senderId: adminId,
            senderName: adminName || 'Administrador',
            senderType: adminRole || 'administrador',
            receiverId: trainerId,
            receiverName: trainerName || 'Entrenador',
            receiverType: 'entrenador',
            message: message,
            timestamp: new Date()
        };
        
        console.log('Datos del mensaje:', messageData);
        
        // Enviar mensaje a través de Socket.io
        socket.emit('admin-trainer-message', messageData);
        console.log('Mensaje emitido al servidor Socket.io');
        
        // Limpiar input
        messageInput.value = '';
        
        // Agregar mensaje al chat localmente (sin esperar respuesta del servidor)
        addMessageToChat(messageData);
        console.log('Mensaje agregado al chat localmente');
    }

    // Event Listeners - Configuración mejorada
    function setupEventListeners() {
        console.log('Configurando event listeners...');
        
        // Obtener el botón de enviar (puede haber cambiado si se actualizó el DOM)
        const sendBtn = document.getElementById('sendButton');
        
        if (sendBtn) {
            console.log('Botón de enviar encontrado, agregando event listener...');
            
            // Eliminar cualquier event listener anterior para evitar duplicados
            sendBtn.removeEventListener('click', sendMessage);
            
            // Agregar el nuevo event listener
            sendBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Botón de enviar clickeado');
                sendMessage();
            });
            
            console.log('Event listener agregado al botón de enviar');
        } else {
            console.error('Error: No se encontró el botón de enviar (ID: sendButton)');
        }
    }
    
    // Configurar event listeners
    setupEventListeners();
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Indicador de escritura
        messageInput.addEventListener('input', function() {
            if (socket && currentTrainerId) {
                socket.emit('admin-writing', {
                    adminId: adminId,
                    trainerId: currentTrainerId
                });
            }
        });
    }
    
    if (searchTrainerChat) {
        searchTrainerChat.addEventListener('input', function() {
            const searchValue = this.value.toLowerCase();
            const trainerItems = document.querySelectorAll('.user-item');
            
            trainerItems.forEach(item => {
                const trainerName = item.querySelector('.user-name').textContent.toLowerCase();
                if (trainerName.includes(searchValue)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Cargar datos del administrador al iniciar la página
    getCurrentAdminData();
    
    // Inicializar click en la pestaña del chat
    const chatTabLink = document.querySelector('a[data-tab="chat-trainers"]');
    if (chatTabLink) {
        chatTabLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Ocultar todas las pestañas
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Mostrar la pestaña de chat
            const chatTab = document.getElementById('chat-trainers');
            if (chatTab) {
                chatTab.classList.add('show', 'active');
            }
            
            // Desactivar todas las pestañas en la navegación
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Activar la pestaña de chat
            this.classList.add('active');
        });
    }

    // Observar los cambios de pestaña para ajustar el tamaño del contenedor de chat
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                const chatTab = document.getElementById('chat-trainers');
                if (chatTab && chatTab.classList.contains('active') && !adminId) {
                    getCurrentAdminData();
                }
            }
        });
    });

    const chatTab = document.getElementById('chat-trainers');
    if (chatTab) {
        observer.observe(chatTab, { attributes: true });
    }
});
