/**
 * Ollama Chat Integration for GimnasioApp
 * This script handles the Ollama chat functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const ollamaButton = document.getElementById('floating-ia-button');
    const ollamaModal = document.createElement('div');
    let conversationHistory = [];
    
    // Crear el modal de chat de Ollama
    function createOllamaModal() {
        ollamaModal.id = 'ollama-modal';
        ollamaModal.className = 'modal';
        ollamaModal.style.position = 'fixed';
        ollamaModal.style.bottom = '100px';
        ollamaModal.style.left = '20px';
        ollamaModal.style.top = 'auto';
        ollamaModal.style.right = 'auto';
        ollamaModal.style.width = '350px';
        ollamaModal.style.height = 'auto';
        ollamaModal.style.zIndex = '2000';
        ollamaModal.style.display = 'none'; // Inicialmente oculto
        ollamaModal.innerHTML = `
            <div class="modal-content" style="border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);">
                <div class="modal-header" style="background-color: #128C7E; color: white; border-radius: 15px 15px 0 0; padding: 15px;">
                    <h5 class="modal-title" style="margin: 0; display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 10px;">🤖</span> Asistente IA
                    </h5>
                    <span class="close" id="ollama-close" style="color: white; font-size: 24px; cursor: pointer;">&times;</span>
                </div>
                <div class="modal-body" id="ollama-chat-messages" style="max-height: 350px; overflow-y: auto; padding: 15px; background-color: #ECE5DD;">
                </div>
                <div class="modal-footer" style="border-top: none; padding: 10px; background-color: #F0F0F0; border-radius: 0 0 15px 15px;">
                    <div style="display: flex; width: 100%; align-items: center;">
                        <input type="text" id="ollama-input" placeholder="Escribe tu mensaje..." 
                            style="flex: 1; margin-right: 10px; padding: 12px; border-radius: 20px; border: none; outline: none;" />
                        <button id="ollama-send" style="background-color: #128C7E; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; cursor: pointer;">
                            <span style="font-size: 18px;">➤</span>
                        </button>
                    </div>
                    <small style="width: 100%; text-align: center; margin-top: 10px; color: #999;">Powered by Ollama</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(ollamaModal);
        
        // Referencias a los nuevos elementos
        const ollamaClose = document.getElementById('ollama-close');
        const ollamaInput = document.getElementById('ollama-input');
        const ollamaSend = document.getElementById('ollama-send');
        const ollamaMessages = document.getElementById('ollama-messages');
        
        // Añadir estilos específicos para el modal de Ollama
        const ollamaStyles = document.createElement('style');
        ollamaStyles.textContent = `
            #ollama-modal .modal-content {
                background: #fff;
                border-radius: 15px;
                max-width: 500px;
            }
            
            #ollama-modal .modal-header {
                background: linear-gradient(45deg, #4e54c8, #8f94fb);
                color: white;
                border-radius: 15px 15px 0 0;
            }
            
            #ollama-messages {
                min-height: 350px;
                max-height: 60vh;
            }
            
            #ollama-modal .user-message {
                background-color: #e9f3ff;
                border-left: 4px solid #4e54c8;
                color: #333;
            }
            
            #ollama-modal .assistant-message {
                background-color: #f9f9f9;
                border-left: 4px solid #8f94fb;
                color: #333;
            }
            
            #ollama-modal .loading-indicator {
                padding: 10px;
                text-align: center;
            }
            
            #ollama-modal .dot {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #8f94fb;
                margin: 0 4px;
                animation: bounce 1.5s infinite ease-in-out;
            }
            
            #ollama-modal .dot:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            #ollama-modal .dot:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            @keyframes bounce {
                0%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
            }
            
            #ollama-modal .modal-footer {
                text-align: center;
                padding: 10px;
                color: #777;
                font-size: 0.8em;
                border-top: 1px solid #eee;
            }
        `;
        document.head.appendChild(ollamaStyles);
        
        // Añadir mensaje inicial
        addMessage("¡Hola! Soy tu asistente de gimnasio basado en Ollama. ¿En qué puedo ayudarte hoy?", "assistant");
        
        // Evento para abrir el modal
        if (ollamaButton) {
            ollamaButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                ollamaModal.style.display = 'block';
                ollamaInput.focus();
                // Quitar la animación de pulso del botón
                ollamaButton.classList.remove('pulse');
            });
        }
        
        // Eventos para cerrar el modal
        ollamaClose.addEventListener('click', function() {
            ollamaModal.style.display = 'none';
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === ollamaModal) {
                ollamaModal.style.display = 'none';
            }
        });
        
        // Enviar mensaje al presionar Enter
        ollamaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Enviar mensaje al hacer clic en el botón
        ollamaSend.addEventListener('click', sendMessage);
        
        // Función para añadir mensajes al chat estilo WhatsApp
        function addMessage(message, sender) {
            const messageElement = document.createElement('div');
            const ollamaMessages = document.getElementById('ollama-chat-messages');
            
            // Estilos base para los mensajes tipo burbuja
            messageElement.style.maxWidth = '75%';
            messageElement.style.padding = '10px 15px';
            messageElement.style.borderRadius = '15px';
            messageElement.style.margin = '8px 0';
            messageElement.style.position = 'relative';
            messageElement.style.wordBreak = 'break-word';
            messageElement.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            messageElement.style.display = 'inline-block';
            
            // Contenedor para alinear correctamente el mensaje
            const messageContainer = document.createElement('div');
            messageContainer.style.width = '100%';
            messageContainer.style.display = 'flex';
            messageContainer.style.marginBottom = '10px';
            
            // Formatear el mensaje
            let formattedMessage = message;
            
            // Definir estilos según el remitente
            if (sender === 'user') {
                // Mensaje del usuario (verde, derecha)
                messageElement.style.backgroundColor = '#DCF8C6';
                messageElement.style.color = '#000';
                messageElement.style.borderTopRightRadius = '5px';
                messageContainer.style.justifyContent = 'flex-end';
                formattedMessage = formattedMessage.replace(/\n/g, '<br>');
            } else if (sender === 'assistant') {
                // Mensaje del asistente (blanco, izquierda)
                messageElement.style.backgroundColor = 'white';
                messageElement.style.color = '#000';
                messageElement.style.borderTopLeftRadius = '5px';
                messageContainer.style.justifyContent = 'flex-start';
                
                // Convertir Markdown a HTML para mensajes del asistente
                formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                         .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                         .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
                                         .replace(/`([^`]+)`/g, '<code>$1</code>')
                                         .replace(/\n/g, '<br>');
            }
            
            // Añadir la hora actual
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
            
            // Contenido del mensaje con hora
            messageElement.innerHTML = `
                <div>${formattedMessage}</div>
                <div style="font-size: 0.7em; color: #999; text-align: right; margin-top: 5px;">
                    ${timeStr}
                </div>
            `;
            
            // Añadir el mensaje al contenedor y el contenedor al chat
            messageContainer.appendChild(messageElement);
            ollamaMessages.appendChild(messageContainer);
            
            // Hacer scroll hasta el final
            ollamaMessages.scrollTop = ollamaMessages.scrollHeight;
        }
        
        // Mostrar indicador de carga estilo WhatsApp
        function showLoading() {
            const loadingId = 'loading-' + Date.now();
            const ollamaMessages = document.getElementById('ollama-chat-messages');
            
            // Crear el contenedor de carga
            const loadingContainer = document.createElement('div');
            loadingContainer.style.width = '100%';
            loadingContainer.style.display = 'flex';
            loadingContainer.style.justifyContent = 'flex-start';
            loadingContainer.style.marginBottom = '10px';
            
            // Crear el indicador de carga
            const loadingDiv = document.createElement('div');
            loadingDiv.id = loadingId;
            loadingDiv.style.backgroundColor = 'white';
            loadingDiv.style.padding = '15px';
            loadingDiv.style.borderRadius = '15px';
            loadingDiv.style.borderTopLeftRadius = '5px';
            loadingDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            loadingDiv.style.maxWidth = '75%';
            
            // Crear los puntos animados
            loadingDiv.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <div class="typing-dot" style="width: 8px; height: 8px; border-radius: 50%; background-color: #999; margin: 0 2px; animation: typing-dot 1.4s infinite ease-in-out both;"></div>
                    <div class="typing-dot" style="width: 8px; height: 8px; border-radius: 50%; background-color: #999; margin: 0 2px; animation: typing-dot 1.4s infinite ease-in-out both; animation-delay: 0.2s;"></div>
                    <div class="typing-dot" style="width: 8px; height: 8px; border-radius: 50%; background-color: #999; margin: 0 2px; animation: typing-dot 1.4s infinite ease-in-out both; animation-delay: 0.4s;"></div>
                </div>
            `;
            
            // Añadir la animación
            const animationStyle = document.createElement('style');
            animationStyle.textContent = `
                @keyframes typing-dot {
                    0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
                    40% { transform: scale(1.0); opacity: 1; }
                }
            `;
            document.head.appendChild(animationStyle);
            
            // Añadir al DOM
            loadingContainer.appendChild(loadingDiv);
            ollamaMessages.appendChild(loadingContainer);
            
            // Hacer scroll hasta el final
            ollamaMessages.scrollTop = ollamaMessages.scrollHeight;
            
            return loadingId;
        }
        
        // Quitar indicador de carga
        function removeLoading(id) {
            const loadingDiv = document.getElementById(id);
            if (loadingDiv) {
                // Encontrar el contenedor padre y eliminarlo por completo
                const parentContainer = loadingDiv.closest('div[style*="flex"]');
                if (parentContainer) {
                    parentContainer.remove();
                } else {
                    loadingDiv.remove();
                }
            }
        }
        
        // Función para enviar mensaje a Ollama
        function sendMessage() {
            const message = ollamaInput.value.trim();
            if (!message) return;
            
            // Añadir mensaje del usuario al chat
            addMessage(message, 'user');
            
            // Limpiar el input
            ollamaInput.value = '';
            
            // Actualizar historial de conversación
            conversationHistory.push({ role: 'user', content: message });
            
            // Mostrar indicador de carga
            const loadingId = showLoading();
            
            // Intentar obtener el ID del cliente logueado
            let clienteId = null;
            try {
                // Verificar si hay un elemento con el ID del cliente en la página
                const clienteIdElement = document.getElementById('clienteId');
                if (clienteIdElement) {
                    clienteId = clienteIdElement.value;
                }
                
                // Como alternativa, buscar en localStorage
                if (!clienteId && localStorage.getItem('clienteId')) {
                    clienteId = localStorage.getItem('clienteId');
                }
                
                // También buscar en el usuario actual si existe
                if (!clienteId && window.currentUser && window.currentUser.id) {
                    clienteId = window.currentUser.id;
                }

                console.log('ID de cliente encontrado:', clienteId);
            } catch (error) {
                console.log('No se pudo obtener ID del cliente:', error);
            }
            
            // Enviar mensaje a Ollama a través del endpoint
            fetch('/api/ollama/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: conversationHistory,
                    clienteId: clienteId
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return response.json();
            })
            .then(data => {
                // Quitar indicador de carga
                removeLoading(loadingId);
                
                // Añadir respuesta al chat
                addMessage(data.response, 'assistant');
                
                // Actualizar historial de conversación
                conversationHistory.push({ role: 'assistant', content: data.response });
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Quitar indicador de carga
                removeLoading(loadingId);
                
                // Mostrar mensaje de error
                addMessage('Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.', 'assistant');
            });
        }
    }
    
    // Inicializar el chat de Ollama
    createOllamaModal();
});
