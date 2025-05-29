const express = require('express');
const connection = require('./database/connection');
const mongoose = require('mongoose');
const {db} = require('./config');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

// Importar el modelo o servicio de ejercicios
const ejercicioService = require('./services/ejercicioService'); // Asegúrate que exista este archivo

// Inicializar Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());  // Para procesar datos JSON
app.use(express.urlencoded({ extended: true }));  // Para procesar datos de formularios (x-www-form-urlencoded)

// Configuración de sesiones mejorada para mayor persistencia
app.use(session({
    secret: 'gimnasioAppSecretKey',
    resave: true,
    saveUninitialized: true, // Cambiado a true para mantener sesiones incluso sin datos
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Solo seguro en producción
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días (un mes)
        httpOnly: true, // Previene acceso desde JavaScript del cliente
        path: '/' // Asegura que la cookie sea válida en toda la aplicación
    },
    rolling: true // Renueva el tiempo de expiración con cada petición
}));

// Importar middleware de autenticación
const { cargarDatosUsuario } = require('./middlewares/authMiddleware');

// Middleware para cargar datos del usuario en cada solicitud
app.use(cargarDatosUsuario);

// Middleware para registrar todas las solicitudes (logging)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Middleware para pasar datos de sesión a las vistas (de la rama remota)
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// Configuración de vistas con EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend/views'));

// Servir archivos estáticos (CSS, imágenes, JS de frontend)
app.use(express.static(path.join(__dirname, 'frontend/public')));

// Importar y configurar las rutas de ChatIA
const chatIARoutes = require('./routes/chatIA');
app.use('/api/chatia', chatIARoutes);

// Importar y configurar las rutas del chat entre administrador y entrenador
const chatAdminRoutes = require('./routes/chatAdmin');
app.use('/', chatAdminRoutes);

// Rutas de las vistas
app.get('/', (req, res) => {
    // Verificar si ya hay una sesión activa
    if (req.session && req.session.usuario) {
        console.log('Usuario ya autenticado, redireccionando al dashboard correspondiente');
        
        // Redireccionar según el tipo de usuario
        if (req.session.usuario.tipoUsuario === 'cliente') {
            return res.redirect(`/frontend/clientes/${req.session.usuario._id}`);
        } else if (req.session.usuario.tipoUsuario === 'entrenador') {
            return res.redirect(`/frontend/entrenadores/${req.session.usuario._id}`);
        } else if (req.session.usuario.tipoUsuario === 'administrador') {
            return res.redirect('/admin/dashboard');
        }
    }
    
    // Si no hay sesión, mostrar el formulario de login
    res.render('login'); 
});

// Ruta para Dietas
app.get('/dietas/:id/dietas', async (req, res) => {
    const entrenadorId = req.params.id;
    try {
        // Aquí iría tu lógica para obtener las dietas asociadas al entrenador desde la base de datos
        // Simulamos que tenemos las dietas del entrenador
        const dietas = [
            { nombre: 'Dieta A', descripcion: 'Descripción de la dieta A' },
            { nombre: 'Dieta B', descripcion: 'Descripción de la dieta B' }
        ];

        res.render('dietas', { dietas, entrenadorId });  // Pasa las dietas a la vista
    } catch (error) {
        res.status(500).send('Error cargando las dietas: ' + error.message);
    }
});

// Ruta para el perfil del entrenador
app.get('/mientrenador/:id/entrenador', async (req, res) => {
    const clienteId = req.params.id;
    try {
        // Importar los modelos necesarios
        const Cliente = require('./models/Cliente');
        const Entrenador = require('./models/Entrenador');
        const Usuario = require('./models/Usuario');
        
        // Buscar el cliente para obtener el ID del entrenador asignado
        const cliente = await Cliente.findById(clienteId);
        
        if (!cliente || !cliente.entrenadorId) {
            return res.status(404).send('No tienes un entrenador asignado. Por favor selecciona un entrenador primero.');
        }
        
        // Buscar el entrenador con sus datos de usuario
        const entrenador = await Entrenador.findById(cliente.entrenadorId).populate('usuarioId');
        
        if (!entrenador) {
            return res.status(404).send('Entrenador no encontrado');
        }
        
        // Buscar los clientes asignados a este entrenador
        const clientesDelEntrenador = await Cliente.find({ entrenadorId: entrenador._id })
            .populate('usuarioId', 'nombre apellido');
            
        // Buscar las rutinas creadas por este entrenador
        const Rutina = require('./models/Rutina');
        const rutinasDelEntrenador = await Rutina.find({ entrenadorId: entrenador._id })
            .populate('clienteId', 'usuarioId')
            .populate({
                path: 'clienteId',
                populate: {
                    path: 'usuarioId',
                    select: 'nombre apellido'
                }
            });
        
        // Preparar los datos del entrenador para la vista
        const datosEntrenador = {
            id: entrenador._id,
            nombre: entrenador.usuarioId.nombre,
            apellido: entrenador.usuarioId.apellido,
            especialidad: entrenador.especialidad || 'Entrenamiento general',
            descripcion: entrenador.descripcionPerfil || 'Entrenador profesional',
            correo: entrenador.usuarioId.correo,
            experiencia: entrenador.experienciaAnios ? `${entrenador.experienciaAnios} años de experiencia` : 'Experiencia profesional',
            certificaciones: entrenador.certificaciones || [],
            fechaAsignacion: cliente.fechaAsignacionEntrenador
        };
        
        // Preparar los datos de los clientes para la vista
        const clientesData = clientesDelEntrenador.map(cliente => ({
            nombre: cliente.usuarioId.nombre,
            apellido: cliente.usuarioId.apellido,
            objetivo: cliente.objetivo || 'No especificado'
        }));
        
        // Preparar los datos de las rutinas para la vista
        const rutinasData = rutinasDelEntrenador.map(rutina => ({
            nombre: rutina.nombre,
            descripcion: rutina.descripcion,
            duracion: rutina.duracionSemanas,
            clienteNombre: rutina.clienteId && rutina.clienteId.usuarioId ? `${rutina.clienteId.usuarioId.nombre} ${rutina.clienteId.usuarioId.apellido}` : 'Cliente'
        }));

        res.render('mientrenador', { 
            entrenador: datosEntrenador,
            clientes: clientesData,
            rutinas: rutinasData
        });
    } catch (error) {
        console.error('Error cargando el perfil del entrenador:', error);
        res.status(500).send('Error cargando el perfil del entrenador: ' + error.message);
    }
});

// Ruta corregida para ejercicios
app.get('/ejercicios', async (req, res) => {
    try {
        const ejercicios = await ejercicioService.listarEjercicios(); // Obtener todos los ejercicios
        res.render('ejercicios', { ejercicios, clienteId: req.user ? req.user.id : 'Invitado' });
    } catch (error) {
        res.status(500).send('Error cargando ejercicios: ' + error.message);
    }
});

// Rutas de la API
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/clientes', require('./routes/cliente'));
app.use('/api/entrenadores', require('./routes/entrenadores'));
app.use('/api/ejercicios', require('./routes/ejercicios'));

// Ruta API para obtener el usuario actual
app.get('/api/usuario-actual', (req, res) => {
  try {
    if (req.session && req.session.usuario) {
      // Devolver información del usuario sin datos sensibles
      console.log('Enviando datos de usuario actual:', req.session.usuario.nombre);
      res.json({
        success: true,
        usuario: {
          _id: req.session.usuario._id,
          nombre: req.session.usuario.nombre,
          apellido: req.session.usuario.apellido,
          email: req.session.usuario.email,
          tipo: req.session.usuario.tipo
        }
      });
    } else {
      res.json({
        success: false,
        mensaje: 'No hay usuario en sesión'
      });
    }
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor'
    });
  }
});

// Endpoint para obtener datos del usuario actual
app.get('/api/usuario-actual', (req, res) => {
  try {
    // Verificar si hay un usuario en la sesión
    if (req.session && req.session.usuario) {
      // Devolver usuario en el formato que espera adminChat.js
      return res.status(200).json({
        success: true,
        usuario: {
          _id: req.session.usuario._id,
          nombre: req.session.usuario.nombre,
          apellido: req.session.usuario.apellido,
          correo: req.session.usuario.correo,
          tipoUsuario: req.session.usuario.tipoUsuario
        }
      });
    } else {
      // No hay usuario en sesión
      return res.status(401).json({ 
        success: false,
        mensaje: 'Usuario no autenticado'
      });
    }
  } catch (error) {
    console.error('Error al obtener datos del usuario actual:', error);
    return res.status(500).json({ 
      success: false,
      mensaje: 'Error al obtener datos del usuario',
      error: error.message
    });
  }
});

// Endpoint para recibir alertas del chat
app.post('/api/admin/alertas', async (req, res) => {
  try {
    console.log('POST a /api/admin/alertas recibido');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const alerta = req.body;
    console.log('Alerta recibida del chat:', alerta);
    
    // Verificar si el body está vacío
    if (!alerta || Object.keys(alerta).length === 0) {
      console.error('Error: Body vacío o inválido');
      return res.status(400).json({ success: false, message: 'Body vacío o inválido' });
    }
    
    // Crear la variable global si no existe
    if (!global.alertasChat) {
      global.alertasChat = [];
    }
    
    // Crear la variable en la sesión si no existe
    if (!req.session.alertasChat) {
      req.session.alertasChat = [];
    }
    
    // Limitar a un máximo de 20 alertas en ambos lugares
    if (global.alertasChat.length >= 20) {
      global.alertasChat.pop(); // Eliminar la más antigua
    }
    
    if (req.session.alertasChat.length >= 20) {
      req.session.alertasChat.pop(); // Eliminar la más antigua
    }
    
    // Agregar la nueva alerta al inicio en ambos lugares
    global.alertasChat.unshift(alerta);
    req.session.alertasChat.unshift(alerta);
    
    // Guardar la alerta en la base de datos
    try {
      // Importar el modelo y la conexión a la base de datos
      const AlertaChat = require('./models/AlertaChat');
      const connection = require('./database/connection');
      
      console.log('Estado de la conexión a MongoDB:', connection.readyState);
      // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
      
      if (connection.readyState !== 1) {
        console.warn('MongoDB no está conectado. Intentando reconectar...');
        await mongoose.connect(`mongodb://${db.host}:${db.port}/${db.database}`, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
      }
      
      // Obtener el nombre del usuario de la sesión si está disponible
      let nombreUsuarioActual = 'Cliente';
      if (req.session && req.session.usuario) {
        // Usar el nombre completo si está disponible o solo el nombre
        if (req.session.usuario.nombre) {
          nombreUsuarioActual = req.session.usuario.nombre;
          // Añadir apellido si existe
          if (req.session.usuario.apellido) {
            nombreUsuarioActual += ' ' + req.session.usuario.apellido;
          }
        }
        console.log('Nombre de usuario logueado:', nombreUsuarioActual);
      }
      
      // Preparar datos para guardar - PRIORIZAR el nombre del usuario logueado
      const alertaDB = new AlertaChat({
        nombreUsuario: nombreUsuarioActual, // Usar el nombre del usuario logueado en lugar del default
        mensaje: alerta.mensaje,
        nivelInteres: alerta.nivelInteres,
        emojiInteres: alerta.emojiInteres,
        color: alerta.color,
        hora: alerta.hora
      });
      
      // Si hay un usuario en la sesión, relacionar la alerta con él
      if (req.session && req.session.usuario && req.session.usuario._id) {
        alertaDB.usuarioId = req.session.usuario._id;
        console.log('Vinculando alerta con usuario ID:', req.session.usuario._id);
      }
      
      // Imprimir el documento que se va a guardar
      console.log('Documento a guardar en alertachats:', JSON.stringify(alertaDB));
      
      // Guardar en la base de datos
      const resultado = await alertaDB.save();
      
      // Verificar que se haya guardado correctamente
      if (resultado && resultado._id) {
        console.log('✅ ALERTA GUARDADA EXITOSAMENTE EN MONGODB');
        console.log('ID de la alerta en la colección "alertachats":', resultado._id);
        console.log('Documento guardado:', JSON.stringify(resultado));
      } else {
        throw new Error('No se pudo guardar la alerta, no se obtuvo ID');
      }
    } catch (dbError) {
      // Solo registrar el error, pero no interrumpir el flujo
      console.error('❌ ERROR AL GUARDAR ALERTA EN MONGODB:', dbError);
      console.error('Detalles completos del error:', JSON.stringify(dbError));
    }
    
    console.log('Alerta guardada correctamente. Total de alertas:', global.alertasChat.length);
    
    res.status(200).json({ success: true, message: 'Alerta recibida correctamente' });
  } catch (error) {
    console.error('Error al procesar alerta del chat:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la alerta: ' + error.message });
  }
});

// Endpoint para obtener alertas del chat (para el dashboard del administrador)
app.get('/api/admin/alertas', async (req, res) => {
  try {
    console.log('GET a /api/admin/alertas recibido');
    
    // Para simplificar las pruebas, eliminamos temporalmente la restricción de administrador
    // En producción, volveríamos a activar esta restricción
    /*
    if (!req.session.usuario || req.session.usuario.tipoUsuario !== 'administrador') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado. Solo administradores pueden ver las alertas.' 
      });
    }
    */
    
    // Obtener las alertas de la variable global o de la sesión
    let alertas = [];
    
    if (global.alertasChat && global.alertasChat.length > 0) {
      alertas = global.alertasChat;
      console.log('Usando alertas de variable global, cantidad:', alertas.length);
    } else if (req.session.alertasChat && req.session.alertasChat.length > 0) {
      alertas = req.session.alertasChat;
      console.log('Usando alertas de sesión, cantidad:', alertas.length);
    } else {
      console.log('No se encontraron alertas');
    }
    
    console.log('Enviando alertas al cliente:', alertas);
    res.status(200).json({ success: true, alertas });
  } catch (error) {
    console.error('Error al obtener alertas del chat:', error);
    res.status(500).json({ success: false, message: 'Error al obtener las alertas: ' + error.message });
  }
});

// Endpoint dedicado para obtener alertas del chat (segunda versión más simple)
app.get('/api/admin/alertas-chat', async (req, res) => {
  try {
    console.log('GET a /api/admin/alertas-chat recibido');
    
    // Obtener alertas de la base de datos
    const AlertaChat = require('./models/AlertaChat');
    const alertasDB = await AlertaChat.find().sort({ fechaCreacion: -1 }).limit(20);
    
    if (alertasDB && alertasDB.length > 0) {
      console.log(`Se encontraron ${alertasDB.length} alertas en la base de datos`);
      
      // Enviar las alertas de la base de datos
      return res.status(200).json({
        success: true,
        alertas: alertasDB
      });
    }
    
    // Si no hay alertas en la DB, usar las de memoria o crear de prueba
    if (!global.alertasChat || global.alertasChat.length === 0) {
      console.log('Generando alertas de prueba...');
      global.alertasChat = [
        {
          _id: 'test-alert-1',
          nombreUsuario: 'Cliente Ejemplo',
          hora: new Date().toLocaleTimeString(),
          mensaje: '¿Cuánto cuesta la membresía?',
          nivelInteres: 'rojo',
          emojiInteres: '🔴',
          color: 'rojo',
          atendida: false
        },
        {
          _id: 'test-alert-2',
          nombreUsuario: 'Visitante Web',
          hora: new Date().toLocaleTimeString(),
          mensaje: '¿Qué horarios tienen las clases?',
          nivelInteres: 'amarillo',
          emojiInteres: '🟡',
          color: 'amarillo',
          atendida: false
        },
        {
          _id: 'test-alert-3',
          nombreUsuario: 'Usuario Nuevo',
          hora: new Date().toLocaleTimeString(),
          mensaje: '¿Dónde está ubicado el gimnasio?',
          nivelInteres: 'verde',
          emojiInteres: '🟢',
          color: 'verde',
          atendida: true
        }
      ];
    }
    
    res.status(200).json({
      success: true,
      alertas: global.alertasChat || []
    });
  } catch (error) {
    console.error('Error en endpoint alertas-chat:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener alertas: ' + error.message,
      alertas: []
    });
  }
});

// Endpoint para marcar una alerta como atendida o no atendida
app.patch('/api/admin/alertas/:id', async (req, res) => {
  try {
    console.log(`PATCH a /api/admin/alertas/${req.params.id} recibido`);
    console.log('Body:', req.body);
    
    const alertaId = req.params.id;
    const { atendida } = req.body;
    
    if (atendida === undefined) {
      return res.status(400).json({
        success: false,
        mensaje: 'El campo "atendida" es requerido'
      });
    }
    
    // Intentar actualizar en la base de datos
    const AlertaChat = require('./models/AlertaChat');
    
    // Verificar si la alerta existe
    const alertaExistente = await AlertaChat.findById(alertaId);
    
    if (alertaExistente) {
      // Actualizar en la base de datos
      const alertaActualizada = await AlertaChat.findByIdAndUpdate(
        alertaId,
        { atendida, comentarios: req.body.comentarios || alertaExistente.comentarios },
        { new: true }
      );
      
      console.log('Alerta actualizada en DB:', alertaActualizada);
      
      return res.status(200).json({
        success: true,
        mensaje: `Alerta marcada como ${atendida ? 'atendida' : 'no atendida'}`,
        alerta: alertaActualizada
      });
    }
    
    // Si no está en la base de datos, intentar actualizar en memoria
    if (global.alertasChat && global.alertasChat.length > 0) {
      const index = global.alertasChat.findIndex(a => a._id === alertaId);
      
      if (index !== -1) {
        global.alertasChat[index].atendida = atendida;
        if (req.body.comentarios) {
          global.alertasChat[index].comentarios = req.body.comentarios;
        }
        
        console.log('Alerta actualizada en memoria:', global.alertasChat[index]);
        
        return res.status(200).json({
          success: true,
          mensaje: `Alerta marcada como ${atendida ? 'atendida' : 'no atendida'}`,
          alerta: global.alertasChat[index]
        });
      }
    }
    
    // Si no se encontró la alerta
    return res.status(404).json({
      success: false,
      mensaje: 'Alerta no encontrada'
    });
  } catch (error) {
    console.error('Error al actualizar alerta:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar la alerta: ' + error.message
    });
  }
});

// Ruta para asignar dietas directamente (método alternativo)
app.post('/dietas/asignar-directo', async (req, res) => {
  try {
    const { dietaId, clienteId } = req.body;
    console.log('Solicitud de asignación directa de dieta recibida:', { dietaId, clienteId });
    
    if (!dietaId || !clienteId) {
      console.error('Faltan datos requeridos:', { dietaId, clienteId });
      return res.status(400).send('Faltan datos requeridos: dietaId y clienteId son obligatorios');
    }
    
    // Importar los modelos necesarios
    const Dieta = require('./models/Dieta');
    const Cliente = require('./models/Cliente');
    
    // Verificar que la dieta exista
    const dieta = await Dieta.findById(dietaId);
    if (!dieta) {
      console.error('Dieta no encontrada con ID:', dietaId);
      return res.status(404).send('Dieta no encontrada');
    }
    
    // Verificar que el cliente exista
    const cliente = await Cliente.findById(clienteId).populate('usuarioId');
    if (!cliente) {
      console.error('Cliente no encontrado con ID:', clienteId);
      return res.status(404).send('Cliente no encontrado');
    }
    
    // Actualizar la dieta con el clienteId usando findByIdAndUpdate
    const dietaActualizada = await Dieta.findByIdAndUpdate(
      dietaId,
      { clienteId: clienteId },
      { new: true }
    );
    
    // Verificar que la actualización se haya realizado correctamente
    if (!dietaActualizada || !dietaActualizada.clienteId) {
      throw new Error('No se pudo actualizar la dieta');
    }
    
    console.log('Dieta asignada correctamente:', {
      dietaId: dietaActualizada._id,
      dietaName: dietaActualizada.nombre,
      clienteId: dietaActualizada.clienteId,
      clienteName: cliente.usuarioId ? (cliente.usuarioId.nombre + ' ' + (cliente.usuarioId.apellido || '')) : 'Cliente sin nombre'
    });
    
    // Redirigir al dashboard del entrenador con mensaje de éxito
    const nombreCliente = cliente.usuarioId ? (cliente.usuarioId.nombre + ' ' + (cliente.usuarioId.apellido || '')) : 'Cliente seleccionado';
    return res.redirect(`/frontend/entrenadores/dashboard?mensaje=${encodeURIComponent('Dieta asignada correctamente a ' + nombreCliente)}`);
  } catch (error) {
    console.error('Error al asignar dieta directamente:', error);
    return res.redirect(`/frontend/entrenadores/dashboard?error=${encodeURIComponent('Error al asignar dieta: ' + error.message)}`);
  }
});

// Ruta para asignar rutinas directamente (método alternativo)
app.post('/rutinas/asignar-directo', async (req, res) => {
  try {
    const { rutinaId, clienteId } = req.body;
    console.log('Solicitud de asignación directa recibida:', { rutinaId, clienteId });
    
    if (!rutinaId || !clienteId) {
      console.error('Faltan datos requeridos:', { rutinaId, clienteId });
      return res.status(400).send('Faltan datos requeridos: rutinaId y clienteId son obligatorios');
    }
    
    // Importar los modelos necesarios
    const Rutina = require('./models/Rutina');
    const Cliente = require('./models/Cliente');
    
    // Verificar que la rutina exista
    const rutina = await Rutina.findById(rutinaId);
    if (!rutina) {
      console.error('Rutina no encontrada con ID:', rutinaId);
      return res.status(404).send('Rutina no encontrada');
    }
    
    // Verificar que el cliente exista
    const cliente = await Cliente.findById(clienteId).populate('usuarioId');
    if (!cliente) {
      console.error('Cliente no encontrado con ID:', clienteId);
      return res.status(404).send('Cliente no encontrado');
    }
    
    // Actualizar la rutina con el clienteId
    rutina.clienteId = clienteId;
    await rutina.save();
    
    console.log('Rutina asignada correctamente:', {
      rutinaId: rutina._id,
      rutinaName: rutina.nombre,
      clienteId: rutina.clienteId,
      clienteName: cliente.usuarioId.nombre + ' ' + cliente.usuarioId.apellido
    });
    
    // Redirigir al dashboard del entrenador con mensaje de éxito
    return res.redirect(`/frontend/entrenadores/dashboard?mensaje=${encodeURIComponent('Rutina asignada correctamente a ' + cliente.usuarioId.nombre + ' ' + cliente.usuarioId.apellido)}`);
  } catch (error) {
    console.error('Error al asignar rutina directamente:', error);
    return res.redirect(`/frontend/entrenadores/dashboard?error=${encodeURIComponent('Error al asignar rutina: ' + error.message)}`);
  }
});

// Ruta para las dietas del cliente
app.get('/clientes/:clienteId/dietas', async (req, res) => {
  try {
    const clienteId = req.params.clienteId;
    console.log('Obteniendo dietas para el cliente:', clienteId);
    
    // Importar los modelos necesarios
    const Dieta = require('./models/Dieta');
    const Cliente = require('./models/Cliente');
    
    // Verificar que el cliente exista
    const cliente = await Cliente.findById(clienteId).populate('usuarioId');
    if (!cliente) {
      console.error('Cliente no encontrado con ID:', clienteId);
      return res.status(404).send('Cliente no encontrado');
    }
    
    console.log('Cliente encontrado:', cliente._id, cliente.usuarioId.nombre);
    
    // Verificar todas las dietas en la base de datos que tengan este clienteId
    console.log('Buscando dietas con clienteId:', clienteId);
    
    // Obtener las dietas asignadas al cliente
    const dietas = await Dieta.find({ clienteId })
      .populate('entrenadorId')
      .sort({ fechaInicio: -1 });
    
    console.log(`Se encontraron ${dietas.length} dietas para el cliente ${clienteId}`);
    
    // Mostrar detalles de las dietas encontradas para depuración
    if (dietas.length > 0) {
      dietas.forEach((dieta, index) => {
        console.log(`Dieta ${index + 1}:`, {
          id: dieta._id,
          nombre: dieta.nombre,
          clienteId: dieta.clienteId,
          entrenadorId: dieta.entrenadorId
        });
      });
    } else {
      console.log('No se encontraron dietas asignadas a este cliente');
    }
    
    // Renderizar la vista con las dietas del cliente
    res.render('clienteDietas', {
      cliente,
      dietas,
      titulo: 'Mis Planes Nutricionales',
      mensaje: req.query.mensaje,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error al obtener dietas del cliente:', error);
    res.status(500).send('Error al obtener dietas: ' + error.message);
  }
});

// Ruta para las rutinas del cliente
app.get('/clientes/:clienteId/rutinas', async (req, res) => {
  try {
    const clienteId = req.params.clienteId;
    console.log('Obteniendo rutinas para el cliente:', clienteId);
    
    // Importar los modelos necesarios
    const Rutina = require('./models/Rutina');
    const Cliente = require('./models/Cliente');
    
    // Verificar que el cliente exista
    const cliente = await Cliente.findById(clienteId).populate('usuarioId');
    if (!cliente) {
      console.error('Cliente no encontrado con ID:', clienteId);
      return res.status(404).send('Cliente no encontrado');
    }
    
    console.log('Cliente encontrado:', cliente._id, cliente.usuarioId.nombre);
    
    // Verificar todas las rutinas en la base de datos que tengan este clienteId
    console.log('Buscando rutinas con clienteId:', clienteId);
    
    // Obtener las rutinas asignadas al cliente
    const rutinas = await Rutina.find({ clienteId })
      .populate('entrenadorId')
      .sort({ fechaInicio: -1 });
    
    console.log(`Se encontraron ${rutinas.length} rutinas para el cliente ${clienteId}`);
    
    // Mostrar detalles de las rutinas encontradas para depuración
    if (rutinas.length > 0) {
      rutinas.forEach((rutina, index) => {
        console.log(`Rutina ${index + 1}:`, {
          id: rutina._id,
          nombre: rutina.nombre,
          clienteId: rutina.clienteId,
          entrenadorId: rutina.entrenadorId
        });
      });
    } else {
      console.log('No se encontraron rutinas asignadas a este cliente');
      
      // Buscar si hay rutinas que deberían estar asignadas a este cliente
      const todasLasRutinas = await Rutina.find({});
      console.log(`Total de rutinas en la base de datos: ${todasLasRutinas.length}`);
      
      // Verificar si alguna rutina tiene este clienteId como string en lugar de ObjectId
      const rutinasConClienteIdString = todasLasRutinas.filter(r => 
        r.clienteId && r.clienteId.toString() === clienteId.toString());
      
      if (rutinasConClienteIdString.length > 0) {
        console.log('Se encontraron rutinas con clienteId como string:', rutinasConClienteIdString.length);
      }
    }
    
    // Renderizar la vista de rutinas del cliente
    return res.render('rutinasCliente', {
      rutinas: rutinas,
      clienteId: clienteId,
      nombreCliente: cliente.usuarioId.nombre + ' ' + cliente.usuarioId.apellido
    });
  } catch (error) {
    console.error('Error al obtener rutinas del cliente:', error);
    return res.status(500).send('Error al obtener rutinas del cliente: ' + error.message);
  }
});
app.use('/api/rutinas', require('./routes/rutinas'));
app.use('/api/progresos', require('./routes/progreso'));
app.use('/api/dietas', require('./routes/dietas'));
app.use('/api/mensajes', require('./routes/mensajes'));
app.use('/api', require('./routes/api')); // Nueva ruta para verificar la base de datos
app.use('/frontend', require('./routes/frontend'));

// Ruta para manejar las citas
app.use('/api/citas', require('./routes/citas'));
// Mantener la ruta anterior para compatibilidad
app.use('/citas', require('./routes/citas'));

// Ruta para manejar las rutinas en la interfaz de usuario
app.use('/rutinas', require('./routes/rutinas'));

// Ruta para manejar los planes nutricionales
app.use('/dietas', require('./routes/dietas'));

// Ruta para manejar los entrenadores
app.use('/entrenadores', require('./routes/entrenadores'));

// Rutas para el panel de administración
app.use('/admin', require('./routes/admin'));

// Rutas para la API del panel de administrador
app.use('/api/admin', require('./routes/adminPanel'));

// Rutas para ChatIA (Ollama)
app.use('/api/chatia', require('./routes/chatIA'));

// Ruta para el chat con Ollama
app.use('/api/ollama', require('./routes/ollama'));

// Rutas para el chat
app.use('/chat', require('./routes/chat'));

// Rutas para el chat entre administrador y entrenadores
try {
    const chatAdminEntrenadorRoutes = require('./routes/chatAdminEntrenador');
    app.use('/chat-admin', chatAdminEntrenadorRoutes);
    console.log('Rutas de chat admin-entrenador cargadas correctamente');
} catch (error) {
    console.error('Error al cargar las rutas de chat admin-entrenador:', error);
}

// Ruta para obtener entrenadores (para el chat)
try {
    const getEntrenadoresRoutes = require('./routes/getEntrenadores');
    app.use('/api/get-entrenadores', getEntrenadoresRoutes);
    console.log('Rutas de obtención de entrenadores cargadas correctamente');
} catch (error) {
    console.error('Error al cargar las rutas de obtención de entrenadores:', error);
}

// Ruta directa para obtener entrenadores sin problemas de autenticación (para el chat del admin)
try {
    const entrenadoresDirectoRoutes = require('./routes/entrenadoresDirecto');
    app.use('/api/entrenadores', entrenadoresDirectoRoutes);
    console.log('Rutas directas para entrenadores cargadas correctamente');
} catch (error) {
    console.error('Error al cargar las rutas directas para entrenadores:', error);
}

// Rutas para la información del gimnasio
app.use('/gimnasio', require('./routes/gimnasio'));

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    // Destruir la sesión
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send('Error al cerrar sesión');
        }
        
        // Redireccionar al login
        res.redirect('/frontend/login');
    });
});

// Configuración de Socket.IO
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Configurar Socket.IO
// Nota: Asegúrate de crear el archivo socket.js si aún no existe
try {
    require('./socket')(io);
} catch (error) {
    console.error('Error al cargar el módulo de socket:', error.message);
    console.log('Asegúrate de crear el archivo socket.js en la raíz del proyecto');
}

// Puerto de escucha
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Aplicación ejecutándose en http://localhost:${PORT}`);
});
