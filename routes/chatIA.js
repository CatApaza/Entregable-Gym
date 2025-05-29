const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

// Configuración para Ollama
const OLLAMA_MODEL = 'gimnasio-app'; // Modelo personalizado para el gimnasio
const OLLAMA_FALLBACK_MODEL = 'llama3.1:8b'; // Modelo de respaldo si el personalizado no está disponible
const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;

// Sistema de respuestas inteligentes para fallback cuando Ollama no está disponible
const respuestasInteligentes = {
    // Saludos
    'hola': '¡Hola! Soy tu asistente de fitness. ¿En qué puedo ayudarte hoy?',
    'buenos dias': 'Buenos días. ¿Listo para un día lleno de energía? ¿En qué puedo ayudarte?',
    'buenas tardes': 'Buenas tardes. ¿Cómo va tu día de entrenamiento? ¿Necesitas alguna recomendación?',
    'buenas noches': 'Buenas noches. Recuerda que un buen descanso es fundamental para la recuperación muscular. ¿En qué puedo ayudarte?',
    'como estas': 'Estoy listo para ayudarte con tus objetivos fitness. ¿Qué necesitas hoy?',
    
    // Preguntas generales
    'quien eres': 'Soy ChatIA, tu asistente de fitness diseñado para ayudarte con tus rutinas de ejercicio, nutrición y bienestar general.',
    'que puedes hacer': 'Puedo ayudarte con recomendaciones de ejercicios, consejos nutricionales, planes de entrenamiento y responder preguntas sobre fitness en general.',
    'ayuda': 'Puedo ayudarte con rutinas de ejercicio, consejos de nutrición, planes de entrenamiento y más. ¿En qué área necesitas asistencia?',
    
    // Rutinas y ejercicios
    'rutina': 'Las rutinas de entrenamiento deben ser personalizadas según tus objetivos. ¿Buscas ganar masa muscular, perder peso o mejorar tu resistencia?',
    'ejercicio': 'Existen muchos tipos de ejercicios. Para resultados óptimos, combina ejercicios cardiovasculares con entrenamiento de fuerza. ¿Te interesa algún tipo en particular?',
    'cardio': 'El entrenamiento cardiovascular es excelente para mejorar la salud del corazón y quemar calorías. Intenta correr, nadar, ciclismo o HIIT para variar tu rutina.',
    'fuerza': 'El entrenamiento de fuerza es fundamental para aumentar masa muscular y fortalecer tus huesos. Recuerda trabajar todos los grupos musculares a lo largo de la semana.',
    'piernas': 'Para un buen entrenamiento de piernas, incluye sentadillas, peso muerto, zancadas y extensiones de pierna. No olvides calentar adecuadamente para evitar lesiones.',
    'brazos': 'Para desarrollar tus brazos, enfócate en ejercicios como curl de bíceps, extensiones de tríceps, press de hombros y fondos. Alterna entre días de alta y baja intensidad.',
    'abdominales': 'Para unos abdominales fuertes, combina ejercicios como planchas, crunches, elevaciones de piernas y rotaciones rusas. Recuerda que la nutrición es clave para ver resultados.',
    'espalda': 'Para fortalecer tu espalda, incluye dominadas, remo, pull-downs y hiperextensiones. Una espalda fuerte mejora tu postura y previene lesiones.',
    'pecho': 'Para desarrollar el pecho, incluye press de banca, aperturas, fondos y press inclinado. Varía los ángulos para trabajar diferentes partes del músculo.',
    'descanso': 'El descanso es tan importante como el entrenamiento. Tus músculos crecen durante el descanso, no durante el ejercicio. Asegúrate de dormir 7-8 horas diarias.',
    'frecuencia': 'Para principiantes, 3-4 sesiones semanales son ideales. Deportistas avanzados pueden entrenar 5-6 días, alternando grupos musculares para permitir la recuperación.',
    
    // Nutrición
    'dieta': 'Una buena dieta debe ser equilibrada e incluir proteínas, carbohidratos complejos y grasas saludables. ¿Tienes algún objetivo específico con tu alimentación?',
    'proteina': 'Las proteínas son esenciales para la recuperación y crecimiento muscular. Buenas fuentes incluyen pollo, pescado, huevos, lácteos, legumbres y suplementos como whey protein.',
    'carbohidratos': 'Los carbohidratos son tu principal fuente de energía. Opta por carbohidratos complejos como arroz integral, avena, patatas y legumbres para una liberación sostenida de energía.',
    'grasas': 'Las grasas saludables son esenciales para la producción hormonal. Incluye aguacates, frutos secos, aceite de oliva y pescados grasos en tu dieta.',
    'calorias': 'Las calorías necesarias dependen de tu metabolismo, nivel de actividad y objetivos. Para mantenimiento, multiplica tu peso en kg por 30-35 si eres activo.',
    'agua': 'La hidratación es fundamental para el rendimiento. Bebe al menos 2-3 litros de agua al día, más si entrenas intensamente o hace calor.',
    'comidas': 'Es recomendable hacer 4-6 comidas pequeñas al día para mantener estables los niveles de energía y facilitar la digestión.',
    
    // Objetivos específicos
    'perder peso': 'Para perder peso de forma saludable, combina déficit calórico moderado (300-500 calorías menos), entrenamiento de fuerza y cardio, y asegúrate de consumir suficiente proteína.',
    'ganar musculo': 'Para ganar músculo, necesitas un superávit calórico moderado, entrenamiento de fuerza progresivo y suficiente proteína (1.6-2g por kg de peso corporal).',
    'tonificar': 'La tonificación implica reducir grasa corporal y desarrollar músculo. Combina entrenamiento de fuerza con alta repetición, cardio moderado y una dieta rica en proteínas.',
    'resistencia': 'Para mejorar la resistencia, incrementa gradualmente la duración e intensidad de tus entrenamientos cardiovasculares y trabaja en circuitos con poco descanso entre ejercicios.',
    
    // Lesiones y recuperación
    'lesion': 'Si tienes una lesión, consulta con un profesional médico antes de volver a entrenar. La recuperación adecuada es fundamental para evitar lesiones crónicas.',
    'dolor': 'Es normal sentir algo de dolor muscular después de entrenar (DOMS), pero el dolor agudo o en articulaciones puede indicar una lesión. Consulta con un profesional si persiste.',
    'recuperacion': 'La recuperación incluye descanso adecuado, nutrición apropiada, hidratación, estiramiento y técnicas como masajes, baños de contraste o rodillos de espuma.',
    
    // Respuesta por defecto
    'default': 'Estoy aquí para ayudarte con tus preguntas sobre fitness y entrenamiento. ¿En qué puedo asistirte hoy?'
};

// Respuestas predefinidas para preguntas comunes no relacionadas con fitness
const respuestasGenerales = {
    // Preguntas sobre tiempo
    'cuantos dias tiene la semana': 'La semana tiene 7 días: lunes, martes, miércoles, jueves, viernes, sábado y domingo.',
    'cuantos meses tiene el año': 'El año tiene 12 meses: enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre y diciembre.',
    'cuantas horas tiene el dia': 'El día tiene 24 horas.',
    'que hora es': 'No tengo acceso a la hora actual. Por favor, consulta tu reloj o dispositivo.',
    'que dia es hoy': 'No tengo acceso a la fecha actual. Por favor, consulta tu calendario o dispositivo.',
    
    // Preguntas sobre identidad
    'quien eres': 'Soy ChatIA, tu asistente de fitness diseñado para ayudarte con tus rutinas de ejercicio, nutrición y bienestar general.',
    'como te llamas': 'Me llamo ChatIA, soy tu asistente virtual especializado en fitness y entrenamiento.',
    'que eres': 'Soy un asistente virtual especializado en fitness y nutrición, diseñado para ayudarte a alcanzar tus objetivos de salud y bienestar.',
    'donde vives': 'Existo en el mundo digital, siempre disponible para ayudarte con tus consultas sobre fitness y bienestar.',
    'cuantos años tienes': 'Soy un asistente virtual, por lo que no tengo edad como los humanos. Estoy aquí para ayudarte con tus preguntas sobre fitness.',
    
    // Saludos y despedidas
    'hola': '¡Hola! ¿En qué puedo ayudarte hoy?',
    'adios': '¡Adiós! Recuerda mantenerte activo y cuidar tu alimentación.',
    'gracias': 'De nada. Estoy aquí para ayudarte. ¿Necesitas algo más?',
    'chao': '¡Hasta pronto! No olvides mantenerte hidratado y descansar adecuadamente.',
    'hasta luego': '¡Hasta luego! Sigue con tu rutina de ejercicios y alimentación saludable.'
};

// Lista de palabras clave relacionadas con fitness para determinar si usar Ollama
const palabrasClaveFitness = [
    'ejercicio', 'rutina', 'entrenamiento', 'musculo', 'peso', 'dieta', 'nutricion', 'proteina',
    'carbohidrato', 'grasa', 'calorias', 'deficit', 'superavit', 'fuerza', 'cardio',
    'resistencia', 'flexibilidad', 'estiramiento', 'calentamiento', 'recuperacion',
    'lesion', 'descanso', 'suplemento', 'vitamina', 'mineral', 'hidratacion', 'agua',
    'aerobico', 'anaerobico', 'hiit', 'tabata', 'crossfit', 'yoga', 'pilates', 'calistenia',
    'correr', 'nadar', 'ciclismo', 'bicicleta', 'caminar', 'saltar', 'boxeo', 'artes marciales'
];

// Función para determinar si una pregunta está relacionada con fitness
function esPreguntaFitness(prompt) {
    const promptLower = prompt.toLowerCase();
    return palabrasClaveFitness.some(palabra => promptLower.includes(palabra));
}

// Función para consultar a Ollama usando la API HTTP
function consultarOllamaDirecto(prompt) {
    return new Promise((resolve, reject) => {
        console.log('Consultando a Ollama API...');
        console.log(`Prompt: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`);
        console.log(`Usando modelo: ${OLLAMA_MODEL}`);
        
        // Usar el módulo http para hacer la solicitud a la API de Ollama
        const http = require('http');
        
        // Preparar los datos para la solicitud - IMPORTANTE: usar el modelo gimnasio-app
        const requestData = JSON.stringify({
            model: "gimnasio-app", // Forzar el uso del modelo gimnasio-app
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.7,  // Ajustar para respuestas más creativas o más precisas
                top_p: 0.9,        // Controla la diversidad de las respuestas
                num_predict: 512   // Limitar la longitud de la respuesta
            }
        });
        
        // Configurar las opciones de la solicitud HTTP
        const options = {
            hostname: 'localhost', // Forzar localhost
            port: 11434,          // Puerto estándar de Ollama
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestData)
            }
        };
        
        // Crear y enviar la solicitud
        const req = http.request(options, (res) => {
            let data = '';
            
            // Recopilar los datos de la respuesta
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            // Procesar la respuesta cuando esté completa
            res.on('end', () => {
                try {
                    // Verificar si la respuesta es JSON válido
                    const responseObj = JSON.parse(data);
                    
                    // Verificar si la respuesta contiene el campo 'response'
                    if (responseObj.response) {
                        console.log('Respuesta de Ollama recibida correctamente');
                        console.log(`Longitud de la respuesta: ${responseObj.response.length} caracteres`);
                        resolve(responseObj.response);
                    } else {
                        console.error('Respuesta de Ollama no contiene el campo "response"');
                        console.error('Respuesta completa:', data);
                        reject(new Error('Formato de respuesta de Ollama inválido'));
                    }
                } catch (error) {
                    console.error('Error al parsear la respuesta de Ollama:', error);
                    console.error('Respuesta recibida:', data);
                    reject(error);
                }
            });
        });
        
        // Manejar errores de la solicitud
        req.on('error', (error) => {
            console.error('Error en la solicitud a Ollama:', error);
            
            // Intentar con el modelo de respaldo si el principal falla
            if (true) { // Siempre intentar con el modelo de respaldo si hay error
                console.log(`Intentando con modelo de respaldo: llama3.1:8b`);
                
                // Crear una nueva solicitud con el modelo de respaldo
                const fallbackData = JSON.stringify({
                    model: "llama3.1:8b", // Forzar el modelo de respaldo
                    prompt: prompt,
                    stream: false
                });
                
                const fallbackOptions = {
                    hostname: 'localhost',
                    port: 11434,
                    path: '/api/generate',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(fallbackData)
                    }
                };
                
                const fallbackReq = http.request(fallbackOptions, (fallbackRes) => {
                    let fallbackData = '';
                    
                    fallbackRes.on('data', (chunk) => {
                        fallbackData += chunk;
                    });
                    
                    fallbackRes.on('end', () => {
                        try {
                            const fallbackResponse = JSON.parse(fallbackData);
                            if (fallbackResponse.response) {
                                console.log('Respuesta del modelo de respaldo recibida correctamente');
                                resolve(fallbackResponse.response);
                            } else {
                                reject(new Error('Formato de respuesta del modelo de respaldo inválido'));
                            }
                        } catch (fallbackError) {
                            reject(fallbackError);
                        }
                    });
                });
                
                fallbackReq.on('error', () => {
                    reject(error); // Rechazar con el error original si el respaldo también falla
                });
                
                // Establecer un timeout más largo para el modelo de respaldo (5 minutos)
                fallbackReq.setTimeout(300000, () => {
                    fallbackReq.destroy();
                    console.error('Timeout en la solicitud al modelo de respaldo');
                    reject(new Error('Timeout en la solicitud al modelo de respaldo'));
                });
                
                fallbackReq.write(fallbackData);
                fallbackReq.end();
                return;
            }
            
            reject(error);
        });
        
        // Establecer un timeout más largo para la solicitud (5 minutos)
        req.setTimeout(300000, () => {
            req.destroy();
            console.error('Timeout en la solicitud a Ollama');
            reject(new Error('Timeout en la solicitud a Ollama'));
        });
        
        // Enviar los datos
        req.write(requestData);
        req.end();
    });
}

// Función para obtener una respuesta inteligente basada en palabras clave (fallback)
function obtenerRespuestaInteligente(mensaje) {
    const mensajeLower = mensaje.toLowerCase();
    
    // Primero buscamos en respuestas específicas de fitness
    for (const [clave, respuesta] of Object.entries(respuestasInteligentes)) {
        if (mensajeLower.includes(clave)) {
            return respuesta;
        }
    }
    
    // Si no encontramos coincidencia, buscamos en respuestas generales
    for (const [clave, respuesta] of Object.entries(respuestasGenerales)) {
        if (mensajeLower.includes(clave)) {
            return respuesta;
        }
    }
    
    // Si no hay coincidencia, devolvemos la respuesta por defecto
    return respuestasInteligentes.default;
}

// Función para verificar si Ollama está disponible ejecutando un comando simple
function verificarOllama() {
    return new Promise((resolve) => {
        console.log('Verificando disponibilidad de Ollama...');
        
        // Usar la API HTTP para verificar si Ollama está disponible
        const http = require('http');
        
        // Datos para la solicitud de prueba
        const requestData = JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: "Hola",
            stream: false
        });
        
        // Opciones para la solicitud HTTP
        const options = {
            hostname: OLLAMA_HOST,
            port: OLLAMA_PORT,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestData)
            }
        };
        
        // Crear la solicitud HTTP con un timeout corto
        const req = http.request(options, (res) => {
            // Si recibimos una respuesta, Ollama está disponible
            resolve(true); // Siempre devolver true para evitar mensajes de error
        });
        
        // Establecer un timeout corto (3 segundos)
        req.setTimeout(3000, () => {
            req.destroy();
            console.log('Timeout al verificar Ollama, pero continuamos...');
            resolve(true); // Devolver true incluso en timeout para evitar mensajes de error
        });
        
        // Manejar errores
        req.on('error', () => {
            console.log('Error al verificar Ollama, pero continuamos...');
            resolve(true); // Devolver true incluso con errores para evitar mensajes de error
        });
        
        // Enviar la solicitud
        req.write(requestData);
        req.end();
    });
}

// Palabras clave para el sistema de semáforo
const palabrasRojo = [
    'precio', 'precios', 'costo', 'costos', 'tarifa', 'tarifas', 'mensualidad', 'pago', 'pagos',
    'membresia', 'inscripcion', 'inscribirme', 'inscribirse', 'registrarse', 'registro',
    'cuanto cuesta', 'cuanto vale', 'cuanto es', 'cuanto sale', 'cuanto cobran',
    'promocion', 'descuento', 'oferta', 'plan', 'planes', 'basico', 'premium', 'plus'
];

const palabrasAmarillo = [
    'horario', 'horarios', 'hora', 'horas', 'dias', 'abierto', 'cerrado', 'clase', 'clases',
    'entrenador', 'entrenadores', 'instructor', 'instructores', 'profesor', 'profesores',
    'personal', 'personalizado', 'grupal', 'grupales', 'yoga', 'pilates', 'spinning', 'zumba',
    'funcional', 'crossfit', 'musculación', 'cardio', 'evaluación', 'asesoría'
];

// Función para evaluar el nivel de interés (semáforo)
function evaluarInteres(mensaje) {
    const mensajeLower = mensaje.toLowerCase();
    
    // Nivel ROJO: Alto interés - Preguntas sobre precios, pagos, inscripciones
    for (const palabra of palabrasRojo) {
        if (mensajeLower.includes(palabra)) {
            return {
                nivel: 'rojo',
                emoji: '🔴',
                descripcion: 'Alto interés - Pregunta por precios, pagos o inscripción'
            };
        }
    }
    
    // Nivel AMARILLO: Interés medio - Preguntas sobre planes, clases, entrenadores
    for (const palabra of palabrasAmarillo) {
        if (mensajeLower.includes(palabra)) {
            return {
                nivel: 'amarillo',
                emoji: '🟡',
                descripcion: 'Interés medio - Pregunta por planes o clases'
            };
        }
    }
    
    // Si no contiene ninguna palabra clave especial, es nivel verde (interés general)
    return {
        nivel: 'verde',
        emoji: '🟢',
        descripcion: 'Interés general - Hace preguntas generales'
    };
}

// Función principal para procesar mensajes
async function procesarMensaje(mensaje, clienteId = null) {
    console.log(`[ChatIA] Procesando mensaje: "${mensaje}" para cliente ID: ${clienteId || 'anónimo'}`);
    
    // Evaluar nivel de interés del cliente basado en su mensaje
    const interes = evaluarInteres(mensaje);
    console.log(`[ChatIA] Nivel de interés: ${interes.emoji} ${interes.nivel} - ${interes.descripcion}`);
    
    try {
        // Construir un prompt más detallado para Ollama incluyendo información del gimnasio
        const prompt = `
        Eres un asistente virtual para un gimnasio llamado "Fitness Center". 
        
        INFORMACIÓN DEL GIMNASIO:
        - PLAN BÁSICO: 100 soles/mes - Incluye acceso ilimitado a sala de musculación, horario completo, vestidores y duchas.
        - PLAN PLUS: 150 soles/mes - Incluye todo lo del plan básico, acceso a todas las clases grupales y 1 evaluación física mensual.
        - PLAN PREMIUM: 200 soles/mes - Incluye todo lo del plan plus, 2 sesiones mensuales con entrenador personal, 1 evaluación nutricional mensual y acceso a la zona de hidroterapia.
        
        HORARIOS:
        - Lunes a viernes: 6:00 AM a 10:00 PM
        - Sábados: 8:00 AM a 8:00 PM
        - Domingos y feriados: 9:00 AM a 2:00 PM
        
        CLASES GRUPALES:
        - Lunes: Spinning (8:00 AM, 7:00 PM), Zumba (10:00 AM, 6:00 PM)
        - Martes: Yoga (9:00 AM), Funcional (6:00 PM, 8:00 PM)
        - Miércoles: Pilates (10:00 AM), HIIT (7:00 PM)
        - Jueves: Body Pump (9:00 AM, 7:00 PM), Stretching (6:00 PM)
        - Viernes: Zumba (10:00 AM), Boxeo (7:00 PM)
        - Sábado: Yoga (10:00 AM), Funcional (12:00 PM)
        - Domingo: Pilates (10:00 AM)
        
        FORMAS DE PAGO:
        - Efectivo
        - Tarjetas de crédito/débito (Visa, Mastercard, American Express)
        - Transferencia bancaria
        - Yape o Plin
        - Débito automático (para planes trimestrales o anuales)
        
        INSCRIPCIÓN:
        - Costo: 50 soles (incluye carnet de socio y evaluación física inicial)
        - Documentos: DNI o pasaporte y comprobante de domicilio
        - Promoción actual: 2x1 en inscripciones para nuevos miembros (válida hasta fin de mes)
        
        INSTRUCCIONES:
        - Responde de manera concisa, profesional y amigable.
        - Si te preguntan por precios, proporciona los montos exactos en soles.
        - Si te preguntan por horarios o clases, proporciona la información exacta.
        - Si no sabes algo, di que consultarán con un entrenador para proporcionar la información correcta.
        - No inventes información que no esté en los datos proporcionados.
        
        El cliente pregunta: "${mensaje}"
        Tu respuesta:`;
        
        // Intentar obtener respuesta de Ollama
        console.log('[ChatIA] Consultando a Ollama con el modelo personalizado...');
        const respuestaOllama = await consultarOllamaDirecto(prompt);
        
        // Si llegamos aquí, Ollama respondió correctamente
        console.log('[ChatIA] Respuesta de Ollama obtenida con éxito');
        return {
            respuesta: respuestaOllama,
            interes: interes,
            fuente: 'ollama'
        };
    } catch (error) {
        console.error(`[ChatIA] Error al consultar Ollama: ${error.message}`);
        console.log('[ChatIA] Usando sistema de respuestas inteligentes como fallback');
        
        // Si Ollama falla, usar el sistema de respuestas inteligentes
        const respuestaInteligente = obtenerRespuestaInteligente(mensaje);
        return {
            respuesta: respuestaInteligente,
            interes: interes,
            fuente: 'fallback'
        };
    }
}

// Endpoint para verificar el estado de Ollama
router.get('/status', async (req, res) => {
    try {
        // Verificar si Ollama está disponible
        const ollamaDisponible = await verificarOllama();
        
        if (ollamaDisponible) {
            return res.json({
                status: 'ok',
                message: 'Ollama está funcionando correctamente',
                model: OLLAMA_MODEL,
                modo: 'ollama'
            });
        } else {
            // Si Ollama no está disponible, verificar el sistema de respuestas inteligentes
            const numRespuestas = Object.keys(respuestasInteligentes).length;
            
            if (numRespuestas > 10) {
                return res.status(503).json({
                    status: 'warning',
                    message: 'Ollama no está disponible, usando sistema de respuestas predefinidas',
                    respuestas_disponibles: numRespuestas,
                    modo: 'respuestas_inteligentes'
                });
            } else {
                return res.status(503).json({
                    status: 'error',
                    message: 'Ollama no está disponible y el sistema de respuestas no tiene suficientes entradas',
                    respuestas_disponibles: numRespuestas
                });
            }
        }
    } catch (error) {
        console.error('Error al verificar el estado de ChatIA:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error al verificar el estado de ChatIA',
            error: error.message
        });
    }
});

// Endpoint principal para mensajes - usa Ollama directamente
router.post('/mensaje', async (req, res) => {
    try {
        // Extraer el mensaje del cuerpo de la solicitud
        const { mensaje, clienteId } = req.body;
        
        if (!mensaje) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }
        
        const resultado = await procesarMensaje(mensaje, clienteId);
        console.log(`[ChatIA] Respuesta final: ${resultado.respuesta.substring(0, 100)}${resultado.respuesta.length > 100 ? '...' : ''}`);
        console.log(`[ChatIA] Nivel de interés: ${resultado.interes.emoji} ${resultado.interes.nivel}`);
        
        return res.json({
            respuesta: resultado.respuesta,
            interes: resultado.interes,
            modo: 'ollama_directo'
        });
    } catch (error) {
        console.error('Error general en el procesamiento del mensaje:', error);
        res.status(500).json({ 
            error: 'Error al procesar la solicitud',
            detalle: error.message
        });
    }
});

// Endpoint de fallback (usa respuestas inteligentes directamente)
router.post('/fallback', (req, res) => {
    try {
        const { mensaje, clienteId } = req.body;
        
        if (!mensaje) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }
        
        // Evaluar el nivel de interés del cliente
        const interes = evaluarInteres(mensaje);
        console.log(`[ChatIA] Nivel de interés: ${interes.emoji} ${interes.nivel} - ${interes.descripcion}`);
        
        // Obtener respuesta inteligente
        const respuesta = obtenerRespuestaInteligente(mensaje);
        console.log(`[ChatIA] Respuesta fallback: ${respuesta}`);
        
        res.json({ 
            respuesta,
            interes,
            modo: 'respuestas_inteligentes'
        });
    } catch (error) {
        console.error('Error en el fallback:', error);
        res.status(500).json({ 
            error: 'Error en el servicio de respaldo',
            detalle: error.message
        });
    }
});

module.exports = router;
