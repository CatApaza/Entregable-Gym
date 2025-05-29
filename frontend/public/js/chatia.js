// Script para el funcionamiento del ChatIA
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const chatIABtn = document.getElementById('chat-ia-btn');
    const chatIAModal = document.getElementById('chatia-modal');
    const chatIAClose = document.getElementById('chatia-close');
    const chatIAInput = document.getElementById('chatia-input');
    const chatIASend = document.getElementById('chatia-send');
    const chatIAMessages = document.getElementById('chatia-messages');
    
    // Verificar que todos los elementos existen
    if (!chatIABtn || !chatIAModal || !chatIAClose || !chatIAInput || !chatIASend || !chatIAMessages) {
        console.error('Error: No se encontraron todos los elementos necesarios para ChatIA');
        return;
    }
    
    console.log('ChatIA inicializado correctamente');
    
    // Abrir el modal de chat
    chatIABtn.addEventListener('click', function() {
        console.log('Botón ChatIA clickeado');
        chatIAModal.style.display = 'block';
        // Hacer scroll hasta el final de los mensajes
        chatIAMessages.scrollTop = chatIAMessages.scrollHeight;
        // Enfocar el input
        setTimeout(() => chatIAInput.focus(), 300);
    });
    
    // Cerrar el modal
    chatIAClose.addEventListener('click', function() {
        chatIAModal.style.display = 'none';
    });
    
    // Cerrar el modal al hacer clic fuera del contenido
    window.addEventListener('click', function(event) {
        if (event.target === chatIAModal) {
            chatIAModal.style.display = 'none';
        }
    });
    
    // Enviar mensaje al presionar Enter
    chatIAInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            enviarMensajeIA();
        }
    });
    
    // Enviar mensaje al hacer clic en el botón
    chatIASend.addEventListener('click', enviarMensajeIA);
    
    // Respuestas directas para preguntas comunes sobre el gimnasio
    const respuestasGimnasio = {
        // Precios y planes
        'cuanto cuesta': 'Tenemos los siguientes planes mensuales:\n\n- PLAN BÁSICO: 100 soles/mes\n  * Acceso ilimitado a sala de musculación\n  * Horario completo\n  * Vestidores y duchas\n\n- PLAN PLUS: 150 soles/mes\n  * Todo lo del plan básico\n  * Acceso a todas las clases grupales\n  * 1 evaluación física mensual\n\n- PLAN PREMIUM: 200 soles/mes\n  * Todo lo del plan plus\n  * 2 sesiones mensuales con entrenador personal\n  * 1 evaluación nutricional mensual\n  * Acceso a la zona de hidroterapia',
        'precio': 'Tenemos los siguientes planes mensuales:\n\n- PLAN BÁSICO: 100 soles/mes\n  * Acceso ilimitado a sala de musculación\n  * Horario completo\n  * Vestidores y duchas\n\n- PLAN PLUS: 150 soles/mes\n  * Todo lo del plan básico\n  * Acceso a todas las clases grupales\n  * 1 evaluación física mensual\n\n- PLAN PREMIUM: 200 soles/mes\n  * Todo lo del plan plus\n  * 2 sesiones mensuales con entrenador personal\n  * 1 evaluación nutricional mensual\n  * Acceso a la zona de hidroterapia',
        'membresia': 'Tenemos los siguientes planes mensuales:\n\n- PLAN BÁSICO: 100 soles/mes\n  * Acceso ilimitado a sala de musculación\n  * Horario completo\n  * Vestidores y duchas\n\n- PLAN PLUS: 150 soles/mes\n  * Todo lo del plan básico\n  * Acceso a todas las clases grupales\n  * 1 evaluación física mensual\n\n- PLAN PREMIUM: 200 soles/mes\n  * Todo lo del plan plus\n  * 2 sesiones mensuales con entrenador personal\n  * 1 evaluación nutricional mensual\n  * Acceso a la zona de hidroterapia',
        'plan basico': 'El PLAN BÁSICO cuesta 100 soles al mes e incluye:\n\n* Acceso ilimitado a sala de musculación\n* Horario completo\n* Vestidores y duchas',
        'plan plus': 'El PLAN PLUS cuesta 150 soles al mes e incluye:\n\n* Todo lo del plan básico\n* Acceso a todas las clases grupales\n* 1 evaluación física mensual',
        'plan premium': 'El PLAN PREMIUM cuesta 200 soles al mes e incluye:\n\n* Todo lo del plan plus\n* 2 sesiones mensuales con entrenador personal\n* 1 evaluación nutricional mensual\n* Acceso a la zona de hidroterapia',
        
        // Horarios
        'horario': 'Nuestros horarios de atención son:\n\n- Lunes a viernes: 6:00 AM a 10:00 PM\n- Sábados: 8:00 AM a 8:00 PM\n- Domingos y feriados: 9:00 AM a 2:00 PM',
        'hora': 'Nuestros horarios de atención son:\n\n- Lunes a viernes: 6:00 AM a 10:00 PM\n- Sábados: 8:00 AM a 8:00 PM\n- Domingos y feriados: 9:00 AM a 2:00 PM',
        
        // Clases
        'clase': 'Nuestro horario de clases grupales es:\n\n- Lunes: Spinning (8:00 AM, 7:00 PM), Zumba (10:00 AM, 6:00 PM)\n- Martes: Yoga (9:00 AM), Funcional (6:00 PM, 8:00 PM)\n- Miércoles: Pilates (10:00 AM), HIIT (7:00 PM)\n- Jueves: Body Pump (9:00 AM, 7:00 PM), Stretching (6:00 PM)\n- Viernes: Zumba (10:00 AM), Boxeo (7:00 PM)\n- Sábado: Yoga (10:00 AM), Funcional (12:00 PM)\n- Domingo: Pilates (10:00 AM)',
        'yoga': 'Las clases de yoga son:\n\n- Martes: 9:00 AM\n- Sábado: 10:00 AM\n\nEstas clases tienen capacidad para 15 personas y están incluidas en los planes Plus y Premium.',
        
        // Formas de pago
        'pago': 'Aceptamos las siguientes formas de pago:\n\n- Efectivo\n- Tarjetas de crédito/débito (Visa, Mastercard, American Express)\n- Transferencia bancaria\n- Yape o Plin\n- Débito automático (para planes trimestrales o anuales)',
        
        // Inscripción
        'inscripcion': 'Para inscribirte necesitas:\n\n- Documento de identidad (DNI o pasaporte)\n- Comprobante de domicilio\n- Pago de inscripción: 50 soles (incluye carnet de socio y evaluación física inicial)\n\nActualmente tenemos una promoción 2x1 en inscripciones para nuevos miembros (válida hasta fin de mes).'
    };
    
    // Función para enviar mensaje al servidor
    function enviarMensajeIA() {
        const mensaje = chatIAInput.value.trim();
        
        if (!mensaje) return;
        
        chatIAInput.value = '';
        
        // Añadir mensaje del usuario al chat
        agregarMensajeChat(mensaje, 'user');
        
        // Verificar si es una pregunta sobre precios u otra información del gimnasio
        const mensajeLower = mensaje.toLowerCase();
        let respuestaDirecta = null;
        let nivelInteres = { nivel: 'verde', emoji: '🟢', descripcion: 'Interés general' };
        
        // Palabras clave para detectar preguntas sobre precios
        const palabrasPrecio = ['precio', 'costo', 'cuanto cuesta', 'cuanto vale', 'tarifa', 'membresia', 'mensualidad', 'plan', 'pago'];
        const palabrasClases = ['clase', 'horario', 'yoga', 'pilates', 'spinning', 'zumba', 'entrenador'];
        
        // Verificar si es una pregunta sobre precios
        const esPreguntaPrecio = palabrasPrecio.some(palabra => mensajeLower.includes(palabra));
        const esPreguntaClases = palabrasClases.some(palabra => mensajeLower.includes(palabra));
        
        // Si es una pregunta sobre precios, mostrar la información de los planes
        if (esPreguntaPrecio) {
            respuestaDirecta = respuestasGimnasio['precio'];
            nivelInteres = { nivel: 'rojo', emoji: '🔴', descripcion: 'Alto interés - Pregunta por precios, pagos o inscripción' };
        }
        // Si es una pregunta sobre un plan específico
        else if (mensajeLower.includes('plan basico') || mensajeLower.includes('plan básico')) {
            respuestaDirecta = respuestasGimnasio['plan basico'];
            nivelInteres = { nivel: 'rojo', emoji: '🔴', descripcion: 'Alto interés - Pregunta por precios, pagos o inscripción' };
        }
        else if (mensajeLower.includes('plan plus')) {
            respuestaDirecta = respuestasGimnasio['plan plus'];
            nivelInteres = { nivel: 'rojo', emoji: '🔴', descripcion: 'Alto interés - Pregunta por precios, pagos o inscripción' };
        }
        else if (mensajeLower.includes('plan premium')) {
            respuestaDirecta = respuestasGimnasio['plan premium'];
            nivelInteres = { nivel: 'rojo', emoji: '🔴', descripcion: 'Alto interés - Pregunta por precios, pagos o inscripción' };
        }
        // Si es una pregunta sobre clases
        else if (esPreguntaClases) {
            if (mensajeLower.includes('yoga')) {
                respuestaDirecta = respuestasGimnasio['yoga'];
            } else {
                respuestaDirecta = respuestasGimnasio['clase'];
            }
            nivelInteres = { nivel: 'amarillo', emoji: '🟡', descripcion: 'Interés medio - Pregunta por planes o clases' };
        }
        // Si es una pregunta sobre horarios
        else if (mensajeLower.includes('horario') || mensajeLower.includes('hora') || mensajeLower.includes('abierto')) {
            respuestaDirecta = respuestasGimnasio['horario'];
            nivelInteres = { nivel: 'amarillo', emoji: '🟡', descripcion: 'Interés medio - Pregunta por planes o clases' };
        }
        // Si es una pregunta sobre formas de pago
        else if (mensajeLower.includes('pago') || mensajeLower.includes('pagar') || mensajeLower.includes('efectivo') || mensajeLower.includes('tarjeta')) {
            respuestaDirecta = respuestasGimnasio['pago'];
            nivelInteres = { nivel: 'rojo', emoji: '🔴', descripcion: 'Alto interés - Pregunta por precios, pagos o inscripción' };
        }
        // Si es una pregunta sobre inscripción
        else if (mensajeLower.includes('inscripcion') || mensajeLower.includes('inscribir') || mensajeLower.includes('registrar') || mensajeLower.includes('unir')) {
            respuestaDirecta = respuestasGimnasio['inscripcion'];
            nivelInteres = { nivel: 'rojo', emoji: '🔴', descripcion: 'Alto interés - Pregunta por precios, pagos o inscripción' };
        }
        // Si no se detecta ninguna de las anteriores, buscar en las respuestas directas
        else {
            for (const [clave, respuesta] of Object.entries(respuestasGimnasio)) {
                if (mensajeLower.includes(clave)) {
                    respuestaDirecta = respuesta;
                    
                    // Determinar nivel de interés
                    if (['precio', 'cuanto cuesta', 'membresia', 'pago', 'inscripcion'].some(k => clave.includes(k))) {
                        nivelInteres = { nivel: 'rojo', emoji: '🔴', descripcion: 'Alto interés - Pregunta por precios, pagos o inscripción' };
                    } else if (['plan', 'clase', 'horario', 'yoga'].some(k => clave.includes(k))) {
                        nivelInteres = { nivel: 'amarillo', emoji: '🟡', descripcion: 'Interés medio - Pregunta por planes o clases' };
                    }
                    
                    break;
                }
            }
        }
        
        if (respuestaDirecta) {
            // Si encontramos una respuesta directa, la mostramos inmediatamente
            console.log('Usando respuesta directa para:', mensajeLower);
            setTimeout(() => {
                agregarMensajeChat(respuestaDirecta, 'bot', nivelInteres);
                
                // Si el nivel de interés es rojo (alto), mostrar notificación
                if (nivelInteres.nivel === 'rojo') {
                    console.log('Cliente con alto interés detectado:', nivelInteres.descripcion);
                }
            }, 1000); // Pequeño retraso para simular procesamiento
        } else {
            // Si no hay respuesta directa, usar el servidor
            // Mostrar indicador de carga
            const loadingId = mostrarCargando();
            
            // Enviar mensaje al servidor
            fetch('/api/chatia/mensaje', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    mensaje, 
                    clienteId: document.getElementById('cliente-id-hidden') ? 
                              document.getElementById('cliente-id-hidden').value : 
                              'anonimo'
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error en la comunicación con el servicio de IA: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Quitar indicador de carga
                quitarCargando(loadingId);
                
                // Añadir respuesta de la IA con el indicador de interés (semáforo)
                agregarMensajeChat(data.respuesta, 'bot', data.interes);
                
                // Si el nivel de interés es rojo (alto), mostrar notificación al administrador
                if (data.interes && data.interes.nivel === 'rojo') {
                    console.log('Cliente con alto interés detectado:', data.interes.descripcion);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Quitar indicador de carga
                quitarCargando(loadingId);
                // Mostrar mensaje de error
                agregarMensajeChat('Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, inténtalo de nuevo más tarde.', 'bot error');
            });
        }
    }
    
    // Función para agregar un mensaje al chat
    function agregarMensajeChat(texto, tipo, interes = null) {
        const mensaje = document.createElement('div');
        mensaje.className = `message ${tipo}`;
        
        if (tipo.includes('user')) {
            mensaje.style.cssText = 'align-self: flex-end; background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); padding: 12px 15px; border-radius: 15px 15px 0 15px; max-width: 80%; color: #16222a;';
        } else if (tipo.includes('bot')) {
            mensaje.style.cssText = 'align-self: flex-start; background: rgba(255, 255, 255, 0.1); padding: 12px 15px; border-radius: 15px 15px 15px 0; max-width: 80%; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); position: relative; color: white;';
        }
        
        if (tipo.includes('error')) {
            mensaje.style.borderColor = 'rgba(220, 53, 69, 0.5)';
        }
        
        // Si hay indicador de interés y es un mensaje del bot, mostrar el semáforo
        if (interes && tipo.includes('bot')) {
            const indicador = document.createElement('div');
            indicador.style.cssText = 'position: absolute; top: -10px; right: -10px; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);';
            
            // Aplicar estilo según el nivel de interés
            if (interes.nivel === 'rojo') {
                indicador.style.backgroundColor = '#ff4d4d'; // Rojo
                indicador.title = 'Alto interés - Pregunta por precios, pagos o inscripción';
                indicador.textContent = '🔴';
            } else if (interes.nivel === 'amarillo') {
                indicador.style.backgroundColor = '#ffcc00'; // Amarillo
                indicador.title = 'Interés medio - Pregunta por planes o entrenadores';
                indicador.textContent = '🟡';
            } else {
                indicador.style.backgroundColor = '#66cc66'; // Verde
                indicador.title = 'Interés general - Hace preguntas generales';
                indicador.textContent = '🟢';
            }
            
            mensaje.appendChild(indicador);
        }
        
        // Crear un contenedor para el texto formateado
        const contenidoMensaje = document.createElement('div');
        contenidoMensaje.style.cssText = 'white-space: pre-line; word-break: break-word;';
        
        // Aplicar el texto directamente para preservar los saltos de línea
        contenidoMensaje.textContent = texto;
        
        mensaje.appendChild(contenidoMensaje);
        chatIAMessages.appendChild(mensaje);
        
        // Hacer scroll hasta el final
        chatIAMessages.scrollTop = chatIAMessages.scrollHeight;
    }
    
    // Mostrar indicador de carga
    function mostrarCargando() {
        const id = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.id = id;
        loadingDiv.className = 'message bot loading';
        loadingDiv.style.cssText = 'align-self: flex-start; background: rgba(255, 255, 255, 0.1); padding: 12px 15px; border-radius: 15px 15px 15px 0; max-width: 80%; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); display: flex; gap: 5px;';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.style.cssText = 'width: 8px; height: 8px; background-color: white; border-radius: 50%; animation: pulse 1.5s infinite ease-in-out;';
            dot.style.animationDelay = (i * 0.2) + 's';
            loadingDiv.appendChild(dot);
        }
        
        chatIAMessages.appendChild(loadingDiv);
        
        // Hacer scroll hasta el final
        chatIAMessages.scrollTop = chatIAMessages.scrollHeight;
        
        return id;
    }
    
    // Quitar indicador de carga
    function quitarCargando(id) {
        const loadingDiv = document.getElementById(id);
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
});
