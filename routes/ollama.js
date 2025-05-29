const express = require('express');
const router = express.Router();
const axios = require('axios');

// Importar modelos necesarios para obtener datos dinámicos
let Cliente, Entrenador, Ejercicio, Dieta, Rutina, Cita;

try {
    Cliente = require('../models/cliente');
    Entrenador = require('../models/entrenador');
    Ejercicio = require('../models/ejercicio');
    Dieta = require('../models/dieta');
    Rutina = require('../models/rutina');
    Cita = require('../models/cita');
    console.log('[Ollama] Modelos cargados correctamente');
} catch (error) {
    console.log('[Ollama] Error al cargar los modelos:', error.message);
    console.log('[Ollama] La integración con la base de datos no estará disponible');
}

// Configuración de Ollama
const OLLAMA_BASE_URL = 'http://localhost:11434'; // URL predeterminada de Ollama
const MODEL_NAME = 'gemma:2b'; // Volviendo al modelo original que sí funcionaba

/**
 * Función para obtener datos dinámicos de la base de datos
 */
async function obtenerDatosDinamicos() {
    try {
        if (!Cliente || !Entrenador || !Ejercicio || !Rutina || !Dieta || !Cita) {
            console.log('[Ollama] Alguno de los modelos no está disponible');
            return null;
        }
        
        // Obtener datos relevantes de la base de datos
        const totalClientes = await Cliente.countDocuments();
        const totalEntrenadores = await Entrenador.countDocuments();
        const totalRutinas = await Rutina.countDocuments();
        const totalEjercicios = await Ejercicio.countDocuments();
        const totalDietas = await Dieta.countDocuments();
        const totalCitas = await Cita.countDocuments();
        
        // Obtener lista de clientes con detalles limitados (sin información sensible)
        let clientesLista = [];
        try {
            const clientes = await Cliente.find().limit(20);
            clientesLista = clientes.map(c => ({
                nombre: c.nombre,
                plan: c.plan || 'Sin plan asignado',
                fechaRegistro: c.fechaRegistro ? new Date(c.fechaRegistro).toLocaleDateString() : 'No disponible',
                activo: c.activo !== undefined ? c.activo : true
            }));
        } catch (e) {
            console.log('[Ollama] No se pudieron obtener datos de clientes', e);
        }
        
        // Obtener ejercicios populares
        let ejerciciosPopulares = [];
        try {
            ejerciciosPopulares = await Ejercicio.find().sort({ popularidad: -1 }).limit(5);
        } catch (e) {
            console.log('[Ollama] No se pudieron obtener ejercicios populares');
        }
        
        // Obtener clases disponibles
        let clasesDisponibles = [];
        try {
            clasesDisponibles = await Rutina.find({ tipo: 'clase' }).sort({ fecha: 1 }).limit(10);
        } catch (e) {
            console.log('[Ollama] No se pudieron obtener clases disponibles');
        }
        
        // Obtener entrenadores activos con sus especialidades
        let entrenadoresInfo = [];
        try {
            const entrenadores = await Entrenador.find().limit(10);
            entrenadoresInfo = entrenadores.map(e => ({
                nombre: e.nombre,
                especialidad: e.especialidad || 'General',
                experiencia: e.experiencia || 'No especificada'
            }));
        } catch (e) {
            console.log('[Ollama] No se pudieron obtener datos de entrenadores');
        }
        
        // Obtener información sobre dietas disponibles
        let dietasDisponibles = [];
        try {
            const dietas = await Dieta.find().limit(5);
            dietasDisponibles = dietas.map(d => ({
                nombre: d.nombre,
                tipo: d.tipo || 'General',
                descripcion: d.descripcion || 'Sin descripción'
            }));
        } catch (e) {
            console.log('[Ollama] No se pudieron obtener datos de dietas');
        }
        
        // Formatear los datos para el contexto
        const datosFormatados = {
            estadisticas: {
                clientes: totalClientes || 0,
                entrenadores: totalEntrenadores || 0,
                rutinas: totalRutinas || 0,
                ejercicios: totalEjercicios || 0,
                dietas: totalDietas || 0,
                citas: totalCitas || 0
            },
            clientes: clientesLista,
            ejerciciosPopulares: ejerciciosPopulares.map(e => ({
                nombre: e.nombre,
                descripcion: e.descripcion,
                tipo: e.tipo,
                musculos: e.musculos
            })) || [],
            clasesDisponibles: clasesDisponibles.map(c => ({
                nombre: c.nombre,
                horario: c.horario,
                instructor: c.instructor,
                descripcion: c.descripcion
            })) || [],
            entrenadores: entrenadoresInfo,
            dietas: dietasDisponibles,
            estructuraSistema: {
                modelos: ['Cliente', 'Entrenador', 'Ejercicio', 'Rutina', 'Dieta', 'Cita', 'Usuario'],
                funcionalidades: ['Gestión de clientes', 'Gestión de entrenadores', 'Asignación de rutinas', 'Programación de citas', 'Chat entre entrenador y cliente', 'Chat con IA asistente']
            }
        };
        
        return datosFormatados;
    } catch (error) {
        console.error('[Ollama] Error al obtener datos dinámicos:', error.message);
        return null;
    }
}

/**
 * Ruta para chat con Ollama
 */
// Ruta para obtener directamente datos dinámicos (para diagnóstico)
router.get('/test-datos', async (req, res) => {
    try {
        const datos = await obtenerDatosDinamicos();
        res.json({
            success: true,
            datos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/chat', async (req, res) => {
    try {
        const { message, history = [], clienteId } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }
        
        console.log(`[Ollama] Mensaje recibido: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
        console.log(`[Ollama] Cliente ID recibido: ${clienteId || 'No proporcionado'}`);
        
        // Comprobar si es una pregunta sobre datos que podemos responder directamente
        const mensajeLower = message.toLowerCase();
        
        // Respuestas directas a preguntas sobre datos (sin usar el modelo)
        if (mensajeLower.includes('cuantos clientes') || mensajeLower.includes('cuántos clientes')) {
            try {
                // Consulta directa a la base de datos
                const totalClientes = await Cliente.countDocuments();
                return res.json({
                    success: true,
                    response: `En este momento hay exactamente ${totalClientes} clientes registrados en la base de datos del gimnasio.`
                });
            } catch (error) {
                console.error('[Ollama] Error al consultar clientes:', error.message);
            }
        }
        else if (mensajeLower.includes('quienes son los clientes') || mensajeLower.includes('quiénes son los clientes') ||
                mensajeLower.includes('cuales son los clientes') || mensajeLower.includes('cuáles son los clientes')) {
            try {
                // Consulta directa a la base de datos
                const clientes = await Cliente.find().limit(20);
                
                if (clientes && clientes.length > 0) {
                    let respuesta = `Los clientes registrados en el gimnasio son:\n`;
                    clientes.forEach((cliente, index) => {
                        respuesta += `${index+1}. ${cliente.nombre} (Plan: ${cliente.plan || 'No especificado'})\n`;
                    });
                    respuesta += `\nEsos son todos los ${clientes.length} clientes registrados actualmente.`;
                    
                    return res.json({
                        success: true,
                        response: respuesta
                    });
                }
            } catch (error) {
                console.error('[Ollama] Error al consultar lista de clientes:', error.message);
            }
        }
        
        // Obtener datos dinámicos si es posible (para otras preguntas)
        let datosDinamicos = null;
        try {
            datosDinamicos = await obtenerDatosDinamicos();
            console.log('[Ollama] Datos dinámicos obtenidos correctamente');
            // Verificar que hay datos
            if (datosDinamicos && datosDinamicos.clientes) {
                console.log(`[Ollama] Número de clientes obtenidos: ${datosDinamicos.clientes.length}`);
            }
        } catch (error) {
            console.log('[Ollama] No se pudieron obtener datos dinámicos:', error.message);
        }
        
        // Si hay un ID de cliente, intentar obtener información personalizada
        let datosCliente = null;
        if (clienteId && Cliente) {
            try {
                console.log(`[Ollama] Buscando cliente con ID: ${clienteId}`);
                const cliente = await Cliente.findById(clienteId).populate('rutinas');
                if (cliente) {
                    console.log(`[Ollama] Cliente encontrado: ${cliente.nombre}`);
                    datosCliente = {
                        nombre: cliente.nombre,
                        planActual: cliente.plan,
                        rutinasAsignadas: cliente.rutinas ? cliente.rutinas.map(r => r.nombre) : [],
                        ultimaVisita: cliente.ultimaVisita
                    };
                } else {
                    console.log(`[Ollama] No se encontró cliente con ID: ${clienteId}`);
                }
            } catch (error) {
                console.log('[Ollama] Error al obtener datos del cliente:', error.message);
            }
        }
        
        // Preparar el historial para Ollama
        const ollamaMessages = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        // Configurar sistema para el contexto del gimnasio con instrucciones simplificadas para gemma:2b
        let systemPrompt = `Eres el asistente virtual oficial de GimnasioApp. Tu trabajo es proporcionar información precisa sobre el gimnasio y responder preguntas generales.

REGLAS IMPORTANTES:
1. Nunca inventes datos que no te proporcione el sistema.
2. Si te preguntan por clientes, usa solo la lista que se te proporciona.
3. Si te preguntan por estadísticas, usa solo los números exactos proporcionados.
4. Para preguntas fuera del gimnasio, responde normalmente.

# INFORMACIÓN DEL GIMNASIO

## Horarios de Atención
- Lunes a viernes: 6:00 AM a 10:00 PM
- Sábados: 8:00 AM a 8:00 PM
- Domingos y feriados: 9:00 AM a 2:00 PM

## Ubicación y Contacto
- Dirección: Av. Principal 123, Lima, Perú
- Teléfono: 555-123-4567
- Email: info@gimnasioapp.com
- Web: www.gimnasioapp.com

## Planes y Precios
- PLAN BÁSICO: 100 soles/mes (Acceso a sala de musculación)
- PLAN PLUS: 150 soles/mes (Básico + clases grupales)
- PLAN PREMIUM: 200 soles/mes (Plus + entrenador personal)

## Clases Disponibles
- Spinning: Lunes y Miércoles 7:00 PM
- Yoga: Martes y Jueves 9:00 AM
- Zumba: Lunes y Viernes 6:00 PM
- Funcional: Martes y Jueves 8:00 PM
- Body Pump: Miércoles 7:00 PM

## Servicios Adicionales
- Evaluación física: 50 soles
- Evaluación nutricional: 70 soles
- Sesión personal: 60 soles/hora

## Reglas del Gimnasio
- Uso obligatorio de toalla
- Prohibido el ingreso con comida
- Devolver pesas y discos a su lugar
- Uso de calzado deportivo adecuado

# ESTRUCTURA DEL SISTEMA GIMNASIOAPP

## Modelos de Base de Datos
- Cliente: Almacena información de los usuarios del gimnasio (nombre, plan, rutinas asignadas, etc.)
- Entrenador: Información sobre los entrenadores (nombre, especialidad, experiencia, etc.)
- Ejercicio: Catálogo de ejercicios disponibles (nombre, descripción, músculos trabajados, etc.)
- Rutina: Contiene rutinas de ejercicio que pueden ser asignadas a clientes
- Dieta: Planes alimenticios para diferentes objetivos
- Cita: Gestiona las citas entre clientes y entrenadores
- Usuario: Gestiona las credenciales de acceso al sistema

## Funcionalidades Principales
- Gestión de clientes: Alta, baja y modificación de clientes
- Gestión de entrenadores: Administración del personal del gimnasio
- Asignación de rutinas: Los entrenadores pueden asignar rutinas específicas a sus clientes
- Programación de citas: Reserva de sesiones con entrenadores
- Chat entre entrenador y cliente: Comunicación directa entre profesionales y usuarios
- Chat con IA asistente: Este sistema de atención virtual (tú)

# Instrucciones finales
Cuando te pregunten sobre el gimnasio, responde amablemente usando solo la información proporcionada arriba.

Cuando te pregunten sobre los clientes, usa exactamente los nombres de la lista de clientes.

Cuando te pregunten cuántos clientes hay, di el número exacto sin redondear.

Nunca inventes datos que no estén aquí. Si no sabes algo, di simplemente "No tengo esa información disponible".

Para preguntas generales no relacionadas con el gimnasio, responde normalmente con tu conocimiento general.`;
        
        // Si tenemos datos dinámicos, añadirlos al prompt
        if (datosDinamicos) {
            // Añadir estadísticas simplificadas pero exactas
            systemPrompt += `

## Estadísticas Actuales
Número EXACTO de clientes activos: ${datosDinamicos.estadisticas.clientes}
Número EXACTO de entrenadores: ${datosDinamicos.estadisticas.entrenadores}
Número EXACTO de rutinas: ${datosDinamicos.estadisticas.rutinas}
Número EXACTO de ejercicios: ${datosDinamicos.estadisticas.ejercicios}
Número EXACTO de dietas: ${datosDinamicos.estadisticas.dietas}
Número EXACTO de citas: ${datosDinamicos.estadisticas.citas}`;
            
            // Añadir entrenadores disponibles si existen
            if (datosDinamicos.entrenadores && datosDinamicos.entrenadores.length > 0) {
                systemPrompt += `

## Entrenadores Disponibles
${datosDinamicos.entrenadores.map(e => `- ${e.nombre}: ${e.especialidad} (Experiencia: ${e.experiencia})`).join('\n')}`;
            }
            
            // Añadir ejercicios populares si existen con detalles
            if (datosDinamicos.ejerciciosPopulares && datosDinamicos.ejerciciosPopulares.length > 0) {
                systemPrompt += `

## Ejercicios Más Populares Actualmente:`;
                
                datosDinamicos.ejerciciosPopulares.forEach((e, i) => {
                    systemPrompt += `\n${i+1}. **${e.nombre}**`;
                    if (e.descripcion) systemPrompt += `\n   Descripción: ${e.descripcion}`;
                    if (e.tipo) systemPrompt += `\n   Tipo: ${e.tipo}`;
                    if (e.musculos) systemPrompt += `\n   Músculos trabajados: ${e.musculos}`;
                });
            }
            
            // Añadir clases disponibles si existen con detalles
            if (datosDinamicos.clasesDisponibles && datosDinamicos.clasesDisponibles.length > 0) {
                systemPrompt += `

## Próximas Clases Disponibles:`;
                
                datosDinamicos.clasesDisponibles.forEach(c => {
                    systemPrompt += `\n- **${c.nombre}**:`;
                    systemPrompt += `\n  Horario: ${c.horario || 'Horario por confirmar'}`;
                    systemPrompt += `\n  Instructor: ${c.instructor || 'Por asignar'}`;
                    if (c.descripcion) systemPrompt += `\n  Descripción: ${c.descripcion}`;
                });
            }
            
            // Añadir dietas disponibles si existen
            if (datosDinamicos.dietas && datosDinamicos.dietas.length > 0) {
                systemPrompt += `

## Dietas Disponibles:`;
                
                datosDinamicos.dietas.forEach(d => {
                    systemPrompt += `\n- **${d.nombre}**:`;
                    systemPrompt += `\n  Tipo: ${d.tipo}`;
                    if (d.descripcion) systemPrompt += `\n  Descripción: ${d.descripcion}`;
                });
            }
            
            // Añadir lista simplificada de clientes
            if (datosDinamicos.clientes && datosDinamicos.clientes.length > 0) {
                systemPrompt += `

## Lista de Clientes
Aquí están TODOS los clientes registrados (${datosDinamicos.clientes.length} en total):
`;
                
                // Agrupar clientes por lotes de 5 para facilitar procesamiento
                for (let i = 0; i < datosDinamicos.clientes.length; i += 5) {
                    const lote = datosDinamicos.clientes.slice(i, i + 5);
                    systemPrompt += lote.map((c, idx) => `${i + idx + 1}. ${c.nombre} (Plan: ${c.plan})`).join('\n') + '\n';
                }
                
                systemPrompt += `\nEstos son TODOS los clientes. No hay más clientes además de estos ${datosDinamicos.clientes.length}.`;
            }
            
            // Añadir información sobre la estructura del sistema
            if (datosDinamicos.estructuraSistema) {
                systemPrompt += `

## Detalles Técnicos del Sistema
- Base de Datos: MongoDB
- Modelos: ${datosDinamicos.estructuraSistema.modelos.join(', ')}
- Principales funcionalidades: ${datosDinamicos.estructuraSistema.funcionalidades.join(', ')}
- Autenticación: JWT (JSON Web Tokens)
- Frontend: Express con EJS, Bootstrap y JavaScript
- Backend: Node.js con Express
- Chat IA: Integración con Ollama usando ${MODEL_NAME}`;
            }
        }
        
        // Si tenemos datos del cliente, personalizar aún más el mensaje
        if (datosCliente) {
            systemPrompt += `

# INFORMACIÓN PERSONALIZADA PARA ${datosCliente.nombre.toUpperCase()}
- Plan actual: ${datosCliente.planActual || 'Sin plan activo'}
- Última visita: ${datosCliente.ultimaVisita ? new Date(datosCliente.ultimaVisita).toLocaleDateString() : 'Sin registro'}`;
            
            if (datosCliente.rutinasAsignadas && datosCliente.rutinasAsignadas.length > 0) {
                systemPrompt += `

## Tus rutinas asignadas:
${datosCliente.rutinasAsignadas.map((r, i) => `${i+1}. ${r}`).join('\n')}`;
            }
            
            // Hacer que el asistente se dirija al cliente por su nombre
            systemPrompt += `\n\nDirígete al usuario por su nombre (${datosCliente.nombre}) para hacer la experiencia más personalizada.`;
        }
        
        // Añadir system prompt al inicio
        if (ollamaMessages.length === 0 || ollamaMessages[0].role !== 'system') {
            ollamaMessages.unshift({
                role: 'system',
                content: systemPrompt
            });
        }
        
        // Añadir el mensaje actual del usuario
        ollamaMessages.push({
            role: 'user',
            content: message
        });
        
        try {
            // Hacer la solicitud a Ollama
            console.log('[Ollama] Enviando solicitud a Ollama...');
            console.log(`[Ollama] Longitud del prompt: ${systemPrompt.length} caracteres`);
            console.log(`[Ollama] Número de mensajes: ${ollamaMessages.length}`);
            
            // Intentar 3 veces con un prompt más corto si es necesario
            let intentos = 0;
            let response;
            let error;
            
            while (intentos < 3) {
                try {
                    response = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
                        model: MODEL_NAME,
                        messages: ollamaMessages,
                        stream: false,
                        options: {
                            temperature: 0.7,
                            num_predict: 256
                        }
                    }, {
                        timeout: 30000 // 30 segundos de timeout
                    });
                    
                    // Si llegamos aquí, la solicitud fue exitosa
                    break;
                } catch (err) {
                    error = err;
                    console.log(`[Ollama] Intento ${intentos + 1} fallido: ${err.message}`);
                    
                    // Si es un error de timeout o tamaño, reducir el prompt
                    if (intentos < 2) {
                        // Acortar el prompt para el siguiente intento
                        let partes = systemPrompt.split('# ');
                        if (partes.length > 2) {
                            // Eliminar la sección menos importante
                            partes.splice(-2, 1);
                            systemPrompt = partes.join('# ');
                            ollamaMessages[0].content = systemPrompt;
                            console.log(`[Ollama] Prompt reducido a ${systemPrompt.length} caracteres`);
                        }
                    }
                    
                    intentos++;
                }
            }
            
            // Si después de los intentos no hay respuesta, lanzar el último error
            if (!response) {
                throw error || new Error('No se pudo conectar con Ollama después de múltiples intentos');
            }
            
            // Extraer la respuesta
            let assistantResponse = response.data.message.content;
            
            console.log(`[Ollama] Respuesta generada: "${assistantResponse.substring(0, 50)}${assistantResponse.length > 50 ? '...' : ''}"`);
            
            // Verificar si la pregunta es sobre datos específicos y usar respuestas pre-programadas
            const mensajeLower = message.toLowerCase();
            let respuestaSobreescrita = false;
            
            // Responder con datos exactos para preguntas sobre clientes
            if (mensajeLower.includes('cuantos clientes') || mensajeLower.includes('cuántos clientes') || 
                mensajeLower.includes('numero de clientes') || mensajeLower.includes('número de clientes')) {
                if (datosDinamicos && datosDinamicos.estadisticas) {
                    assistantResponse = `En este momento, hay exactamente ${datosDinamicos.estadisticas.clientes} clientes registrados en la base de datos del gimnasio.`;
                    respuestaSobreescrita = true;
                }
            }
            
            // Responder con datos exactos para preguntas sobre la lista de clientes
            else if (mensajeLower.includes('quienes son los clientes') || mensajeLower.includes('quiénes son los clientes') ||
                    mensajeLower.includes('cuales son los clientes') || mensajeLower.includes('cuáles son los clientes') ||
                    mensajeLower.includes('lista de clientes') || mensajeLower.includes('clientes registrados')) {
                if (datosDinamicos && datosDinamicos.clientes && datosDinamicos.clientes.length > 0) {
                    assistantResponse = `Los clientes registrados en el gimnasio son:\n`;
                    datosDinamicos.clientes.forEach((cliente, index) => {
                        assistantResponse += `${index+1}. ${cliente.nombre} (Plan: ${cliente.plan})\n`;
                    });
                    assistantResponse += `\nEsos son todos los ${datosDinamicos.clientes.length} clientes registrados actualmente.`;
                    respuestaSobreescrita = true;
                } else {
                    assistantResponse = 'No hay clientes registrados en el sistema o no puedo acceder a esa información en este momento.';
                    respuestaSobreescrita = true;
                }
            }
            
            // Otras preguntas específicas que queramos manejar con respuestas pre-programadas
            else if (mensajeLower.includes('cuantos entrenadores') || mensajeLower.includes('cuántos entrenadores')) {
                if (datosDinamicos && datosDinamicos.estadisticas) {
                    assistantResponse = `Actualmente contamos con ${datosDinamicos.estadisticas.entrenadores} entrenadores en el gimnasio.`;
                    respuestaSobreescrita = true;
                }
            }
            
            if (respuestaSobreescrita) {
                console.log('[Ollama] Se utilizó respuesta pre-programada para datos específicos');
            }
            
            // Enviar respuesta al cliente
            res.json({
                success: true,
                response: assistantResponse
            });
        } catch (error) {
            console.error('[Ollama] Error al procesar mensaje:', error.message);
            
            // Verificar si es un error de conexión con Ollama
            if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.message.includes('connect')) {
                console.log('[Ollama] Error de conexión con Ollama. Proporcionando respuesta de fallback.');
                
                // Respuestas predefinidas de fallback para diferentes tipos de consultas
                const respuestasGimnasio = {
                    // Respuestas sobre precios y planes
                    'precio': 'Tenemos varios planes adaptados a tus necesidades:\n\n- **PLAN BÁSICO**: 100 soles/mes\n  * Acceso a sala de musculación\n  * Horario completo\n  * Vestidores\n\n- **PLAN PLUS**: 150 soles/mes\n  * Todo lo del plan básico\n  * Acceso a clases grupales\n  * Evaluación física\n\n- **PLAN PREMIUM**: 200 soles/mes\n  * Todo lo del plan plus\n  * 2 sesiones con entrenador personal\n  * Evaluación nutricional',
                    
                    // Respuestas sobre horarios
                    'horario': 'Nuestros horarios de atención son:\n\n- Lunes a viernes: 6:00 AM a 10:00 PM\n- Sábados: 8:00 AM a 8:00 PM\n- Domingos y feriados: 9:00 AM a 2:00 PM',
                    
                    // Respuestas sobre ubicación
                    'ubicacion': 'Estamos ubicados en:\n\nAv. Principal 123, Lima, Perú\n\nPuedes contactarnos al 555-123-4567 o por email a info@gimnasioapp.com',
                    
                    // Respuestas sobre clases
                    'clase': 'Ofrecemos diversas clases grupales:\n\n- Spinning: Lunes y Miércoles 7:00 PM\n- Yoga: Martes y Jueves 9:00 AM\n- Zumba: Lunes y Viernes 6:00 PM\n- Funcional: Martes y Jueves 8:00 PM\n- Body Pump: Miércoles 7:00 PM',
                    
                    // Respuesta genérica de saludo
                    'hola': '¡Hola! Soy el asistente virtual de GimnasioApp. ¿En qué puedo ayudarte hoy?',
                    
                    // Respuesta por defecto
                    'default': 'Gracias por tu consulta. Como asistente de GimnasioApp, puedo ayudarte con información sobre:\n\n- Precios y planes\n- Horarios de atención\n- Clases disponibles\n- Ubicación y contacto\n\n¿Sobre qué tema te gustaría más información?'
                };
                
                // Determinar la respuesta apropiada basada en palabras clave en el mensaje
                let respuesta = respuestasGimnasio['default'];
                const mensajeLower = message.toLowerCase();
                
                // Verificar palabras clave en el mensaje
                if (mensajeLower.includes('precio') || mensajeLower.includes('costo') || mensajeLower.includes('tarifa') || mensajeLower.includes('plan')) {
                    respuesta = respuestasGimnasio['precio'];
                } else if (mensajeLower.includes('horario') || mensajeLower.includes('hora') || mensajeLower.includes('abierto')) {
                    respuesta = respuestasGimnasio['horario'];
                } else if (mensajeLower.includes('ubicacion') || mensajeLower.includes('direccion') || mensajeLower.includes('donde')) {
                    respuesta = respuestasGimnasio['ubicacion'];
                } else if (mensajeLower.includes('clase') || mensajeLower.includes('actividad') || mensajeLower.includes('grupo')) {
                    respuesta = respuestasGimnasio['clase'];
                } else if (mensajeLower.includes('hola') || mensajeLower.includes('buenas') || mensajeLower.includes('saludos')) {
                    respuesta = respuestasGimnasio['hola'];
                }
                
                // Si hay datos del cliente, personalizar el saludo
                if (datosCliente && datosCliente.nombre && mensajeLower.includes('hola')) {
                    respuesta = `¡Hola ${datosCliente.nombre}! Soy el asistente virtual de GimnasioApp. ¿En qué puedo ayudarte hoy?`;
                }
                
                return res.json({
                    success: true,
                    response: respuesta,
                    isBackup: true
                });
            }
            
            // Para otros errores, enviar una respuesta genérica
            res.json({
                success: true,
                response: 'Lo siento, estoy teniendo algunos problemas técnicos. Por favor, contacta directamente con recepción al 555-123-4567 para obtener la información que necesitas.'
            });
        }
    } catch (error) {
        console.error('[Ollama] Error general:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

module.exports = router;
