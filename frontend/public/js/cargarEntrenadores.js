/**
 * Script dedicado para cargar entrenadores directamente desde la base de datos
 * para el chat de administradores.
 */

// Variables globales para compartir con adminChat.js
window.currentTrainerId = null;
window.currentTrainerName = null;

function cargarEntrenadoresParaChat() {
    const trainersListChat = document.getElementById('trainersListChat');
    if (!trainersListChat) return;

    console.log('Iniciando carga de entrenadores para el chat...');
    trainersListChat.innerHTML = '<div class="text-center mt-4 text-white-50"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-2">Cargando entrenadores...</p></div>';

    // Obtener datos directamente sin autenticación adicional
    fetch('/api/entrenadores/lista-directa')
        .then(response => {
            console.log('Respuesta del servidor:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Datos de entrenadores recibidos:', data);
            
            if (data && data.entrenadores && data.entrenadores.length > 0) {
                renderizarEntrenadores(data.entrenadores, trainersListChat);
            } else {
                trainersListChat.innerHTML = '<p class="text-center text-white-50">No se encontraron entrenadores.</p>';
            }
        })
        .catch(error => {
            console.error('Error al cargar entrenadores:', error);
            trainersListChat.innerHTML = `
                <div class="text-center mt-4 text-white-50">
                    <p>Error al cargar entrenadores.</p>
                    <button id="reintentarCarga" class="btn btn-outline-light btn-sm mt-2">Reintentar</button>
                </div>`;
            
            document.getElementById('reintentarCarga')?.addEventListener('click', cargarEntrenadoresParaChat);
        });
}

function renderizarEntrenadores(entrenadores, contenedor) {
    contenedor.innerHTML = '';
    
    if (entrenadores.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-white-50">No se encontraron entrenadores.</p>';
        return;
    }
    
    entrenadores.forEach(entrenador => {
        // Extraer los datos correctamente
        const id = entrenador._id || (entrenador.usuarioId ? entrenador.usuarioId._id : '');
        const nombre = entrenador.nombre || (entrenador.usuarioId ? entrenador.usuarioId.nombre : 'Sin nombre');
        const apellido = entrenador.apellido || (entrenador.usuarioId ? entrenador.usuarioId.apellido : '');
        
        // Crear elemento de entrenador
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.id = id;
        userItem.style.cssText = 'display: flex; align-items: center; padding: 10px; border-radius: 8px; margin-bottom: 10px; transition: background-color 0.3s; cursor: pointer;';
        
        // Usar iniciales para el avatar
        const initials = getInitials(nombre, apellido);
        
        userItem.innerHTML = `
            <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background-color: #0dcaf0; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold; font-size: 16px;">${initials}</div>
            <div class="user-info" style="flex: 1;">
                <div class="user-name" style="font-weight: 600;">${nombre} ${apellido}</div>
                <div class="user-status" style="font-size: 0.8rem; opacity: 0.8;">
                    <span>Entrenador</span>
                    <span class="online-indicator" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-left: 5px; background-color: #6c757d;"></span>
                </div>
            </div>
            <div class="unread-count" style="display: none;">
                <span class="badge bg-danger" style="border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem;">0</span>
            </div>
        `;
        
        // Añadir eventos
        userItem.addEventListener('click', () => {
            // Guardar el entrenador seleccionado en variables globales para que adminChat.js pueda acceder
            window.currentTrainerId = id;
            window.currentTrainerName = nombre + ' ' + apellido;
            
            console.log('Entrenador seleccionado desde cargarEntrenadores.js');
            console.log('ID:', window.currentTrainerId);
            console.log('Nombre:', window.currentTrainerName);
            
            // Si existe la función selectTrainer en adminChat.js, llamarla
            if (typeof selectTrainer === 'function') {
                selectTrainer({
                    _id: id,
                    nombre: nombre,
                    apellido: apellido
                });
            } else {
                // Implementación de respaldo por si selectTrainer no está disponible
                // Actualizar UI
                document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
                userItem.classList.add('active');
                
                // Mostrar área de chat
                const noTrainerSelected = document.getElementById('noTrainerSelected');
                const activeChatArea = document.getElementById('activeChatArea');
                if (noTrainerSelected) noTrainerSelected.style.display = 'none';
                if (activeChatArea) activeChatArea.style.display = 'flex';
                
                // Actualizar encabezado
                const chatHeader = document.getElementById('chatHeader');
                if (chatHeader) {
                    chatHeader.innerHTML = `
                        <div style="display: flex; align-items: center;">
                            <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background-color: #0dcaf0; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold; font-size: 16px;">${getInitials(nombre, apellido)}</div>
                            <div>
                                <div style="font-weight: bold;">${nombre} ${apellido}</div>
                                <div style="font-size: 0.8rem; color: #6c757d;">Entrenador</div>
                            </div>
                        </div>
                    `;
                }
            }
        });
        
        userItem.addEventListener('mouseover', () => {
            userItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });
        
        userItem.addEventListener('mouseout', () => {
            if (window.currentTrainerId !== id) {
                userItem.style.backgroundColor = '';
            }
        });
        
        contenedor.appendChild(userItem);
    });
}

// Obtener iniciales del nombre
function getInitials(firstName, lastName) {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
}

// Función global para seleccionar entrenador y conectarla con adminChat.js
function selectTrainer(trainer) {
    console.log('Entrenador seleccionado:', trainer);
    // Exponer el entrenador seleccionado globalmente
    window.currentSelectedTrainer = trainer;
    
    try {
        // Intentar usar la función de adminChat.js si existe
        if (typeof window.selectTrainerChat === 'function') {
            console.log('Usando función selectTrainerChat de adminChat.js');
            window.selectTrainerChat(trainer);
        } else {
            // Si no existe, intentar implementar la funcionalidad básica aquí
            console.log('Implementando selección de entrenador localmente');
            
            // Buscar elementos del chat
            const chatHeader = document.getElementById('chatHeader');
            const noTrainerSelected = document.getElementById('noTrainerSelected');
            const activeChatArea = document.getElementById('activeChatArea');
            const chatMessages = document.getElementById('chatMessages');
            
            // Desactivar selección anterior
            const activeItem = document.querySelector('.user-item.active');
            if (activeItem) {
                activeItem.classList.remove('active');
                activeItem.style.backgroundColor = '';
            }
            
            // Activar nuevo entrenador
            const trainerItem = document.querySelector(`.user-item[data-id="${trainer._id}"]`);
            if (trainerItem) {
                trainerItem.classList.add('active');
                trainerItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
            
            // Actualizar variables globales
            window.currentTrainerId = trainer._id;
            window.currentTrainerName = `${trainer.nombre} ${trainer.apellido}`;
            
            // Actualizar header del chat si existe
            if (chatHeader) {
                const initials = getInitials(trainer.nombre, trainer.apellido);
                chatHeader.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background-color: #0dcaf0; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold; font-size: 16px;">${initials}</div>
                        <div>
                            <div style="font-weight: bold;">${trainer.nombre} ${trainer.apellido}</div>
                            <div style="font-size: 0.8rem; color: #6c757d;">Entrenador</div>
                        </div>
                    </div>
                `;
            }
            
            // Mostrar área de chat activa si existen los elementos
            if (noTrainerSelected && activeChatArea) {
                noTrainerSelected.style.display = 'none';
                activeChatArea.style.display = 'flex';
            }
            
            // Si hay socket inicializado globalmente, registrar la selección
            if (window.socket) {
                // Obtener ID del admin
                fetch('/api/usuario-actual')
                    .then(response => response.json())
                    .then(data => {
                        if (data.success && data.usuario) {
                            const adminId = data.usuario._id;
                            
                            // Unirse al chat
                            window.socket.emit('join-admin-trainer-chat', {
                                adminId: adminId,
                                trainerId: trainer._id
                            });
                            
                            // Cargar mensajes si existe el contenedor
                            if (chatMessages) {
                                chatMessages.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Cargando mensajes...</p></div>';
                                
                                fetch(`/chat-admin/api/mensajes/${adminId}/${trainer._id}`)
                                    .then(response => response.json())
                                    .then(data => {
                                        if (data.success && data.mensajes) {
                                            renderizarMensajes(data.mensajes, chatMessages);
                                        } else {
                                            chatMessages.innerHTML = '<p class="text-center text-muted my-4">No hay mensajes anteriores. Comienza la conversación.</p>';
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Error al cargar mensajes:', error);
                                        chatMessages.innerHTML = '<p class="text-center text-danger my-4">Error al cargar mensajes.</p>';
                                    });
                            }
                        }
                    })
                    .catch(err => console.error('Error al obtener datos del admin:', err));
            }
        }
    } catch (error) {
        console.error('Error al seleccionar entrenador:', error);
    }
}

// Función auxiliar para renderizar mensajes
function renderizarMensajes(mensajes, contenedor) {
    if (!contenedor || !mensajes || mensajes.length === 0) {
        if (contenedor) {
            contenedor.innerHTML = '<p class="text-center text-muted my-4">No hay mensajes anteriores. Comienza la conversación.</p>';
        }
        return;
    }
    
    contenedor.innerHTML = '';
    
    // Obtener el ID del admin
    fetch('/api/usuario-actual')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.usuario) {
                const adminId = data.usuario._id;
                
                mensajes.forEach(mensaje => {
                    const isOutgoing = mensaje.senderId === adminId;
                    
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message';
                    messageDiv.style.cssText = `max-width: 70%; padding: 10px 15px; border-radius: 15px; position: relative; word-wrap: break-word; margin-bottom: 15px; align-self: ${isOutgoing ? 'flex-end' : 'flex-start'}; display: flex; flex-direction: column;`;
                    
                    // Estilo según si es enviado o recibido
                    if (isOutgoing) {
                        messageDiv.style.backgroundColor = '#dcf8c6';
                        messageDiv.style.borderBottomRightRadius = '5px';
                        messageDiv.style.marginLeft = 'auto';
                    } else {
                        messageDiv.style.backgroundColor = '#f1f0f0';
                        messageDiv.style.borderBottomLeftRadius = '5px';
                        messageDiv.style.marginRight = 'auto';
                    }
                    
                    // Formatear hora
                    const messageTime = new Date(mensaje.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'message-content';
                    contentDiv.textContent = mensaje.message;
                    
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'message-info';
                    infoDiv.style.cssText = 'font-size: 0.75rem; color: #666; margin-top: 5px; display: flex; justify-content: space-between;';
                    
                    const senderSpan = document.createElement('span');
                    senderSpan.textContent = isOutgoing ? 'Tú' : `${mensaje.senderName}`;
                    
                    const timeSpan = document.createElement('span');
                    timeSpan.textContent = messageTime;
                    
                    infoDiv.appendChild(senderSpan);
                    infoDiv.appendChild(timeSpan);
                    
                    messageDiv.appendChild(contentDiv);
                    messageDiv.appendChild(infoDiv);
                    
                    contenedor.appendChild(messageDiv);
                });
                
                // Scroll al final
                contenedor.scrollTop = contenedor.scrollHeight;
            }
        });
}

// Ejecutar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página correcta
    if (document.getElementById('trainersListChat')) {
        console.log('Página de chat de administrador detectada');
        cargarEntrenadoresParaChat();
    }
});

// Exportar las funciones para uso externo
window.cargarEntrenadoresParaChat = cargarEntrenadoresParaChat;
