const express = require('express');
const router = express.Router();
const MensajeAdminEntrenador = require('../models/MensajeAdminEntrenador');
const Entrenador = require('../models/Entrenador');
const Usuario = require('../models/Usuario');
const { cargarDatosUsuario } = require('../middlewares/authMiddleware');

// Middleware para verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }
    // Verificar si es una solicitud AJAX
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(401).json({ error: 'No autenticado', redirect: '/login' });
    }
    console.log('Usuario no autenticado, redirigiendo a /login');
    return res.redirect('/login');
};

// Middleware para verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
    if (req.session && req.session.usuario && req.session.usuario.tipoUsuario === 'administrador') {
        return next();
    }
    return res.status(403).send('Acceso denegado: Se requiere ser administrador');
};

// Middleware para verificar si el usuario es entrenador
const isEntrenador = (req, res, next) => {
    if (req.session && req.session.usuario && req.session.usuario.tipoUsuario === 'entrenador') {
        return next();
    }
    return res.status(403).send('Acceso denegado: Se requiere ser entrenador');
};

// Ruta para que el admin vea el chat con entrenadores
router.get('/admin', [isAuthenticated, isAdmin], async (req, res) => {
    try {
        console.log('Cargando vista de chat para administrador...');
        console.log('Usuario en sesión:', req.session.usuario);
        
        // Obtener la lista de entrenadores para el chat
        const entrenadores = await Entrenador.find()
            .populate('usuarioId', 'nombre apellido');
            
        console.log(`Se encontraron ${entrenadores.length} entrenadores para el chat`);
        
        res.render('chat-admin-entrenador', { 
            usuario: req.session.usuario,
            titulo: 'Chat con Entrenadores',
            entrenadores: entrenadores
        });
    } catch (error) {
        console.error('Error al cargar el chat de administrador:', error);
        res.status(500).send('Error al cargar el chat: ' + error.message);
    }
});

// Ruta para que el entrenador acceda al chat con el administrador
router.get('/entrenador', [isAuthenticated, isEntrenador], async (req, res) => {
    try {
        console.log('Cargando vista de chat para entrenador...');
        console.log('Usuario en sesión:', req.session.usuario);
        
        // Buscar mensajes existentes con el administrador
        const administradores = await Usuario.find({ tipoUsuario: 'administrador' });
        let adminId = null;
        let adminNombre = 'Administrador';
        
        if (administradores && administradores.length > 0) {
            adminId = administradores[0]._id;
            adminNombre = `${administradores[0].nombre} ${administradores[0].apellido}`;
            console.log(`Administrador encontrado: ${adminNombre} (${adminId})`);
        } else {
            console.log('No se encontraron administradores en la base de datos');
        }
        
        let mensajes = [];
        
        if (adminId) {
            mensajes = await MensajeAdminEntrenador.getConversation(
                req.session.usuario._id,
                adminId.toString()
            );
            console.log(`Se encontraron ${mensajes.length} mensajes en la conversación`);
        }
        
        res.render('chat-entrenador-admin', {
            usuario: req.session.usuario,
            mensajes: mensajes,
            titulo: 'Chat con Administrador',
            adminId: adminId,
            adminNombre: adminNombre
        });
    } catch (error) {
        console.error('Error al cargar el chat del entrenador:', error);
        res.status(500).send('Error al cargar el chat: ' + error.message);
    }
});

// Ruta para obtener datos del administrador (para el chat del entrenador)
router.get('/api/admin-info', isAuthenticated, async (req, res) => {
    try {
        const administrador = await Usuario.findOne({ tipoUsuario: 'administrador' });
        
        if (!administrador) {
            return res.status(404).json({
                success: false,
                mensaje: 'No se encontró ningún administrador'
            });
        }
        
        return res.status(200).json({
            success: true,
            adminId: administrador._id,
            nombre: administrador.nombre,
            apellido: administrador.apellido
        });
    } catch (error) {
        console.error('Error al obtener información del administrador:', error);
        return res.status(500).json({
            success: false,
            mensaje: 'Error al obtener información del administrador: ' + error.message
        });
    }
});

// API para obtener la lista de entrenadores (para el chat del administrador)
router.get('/api/entrenadores', [isAuthenticated, isAdmin], async (req, res) => {
    try {
        const entrenadores = await Entrenador.find()
            .populate('usuarioId', 'nombre apellido email');
            
        return res.status(200).json({
            success: true,
            entrenadores: entrenadores.map(e => ({
                _id: e.usuarioId._id,
                nombre: e.usuarioId.nombre,
                apellido: e.usuarioId.apellido,
                email: e.usuarioId.email,
                online: false // El estado online se actualiza desde socket.io
            }))
        });
    } catch (error) {
        console.error('Error al obtener lista de entrenadores:', error);
        return res.status(500).json({
            success: false,
            mensaje: 'Error al obtener lista de entrenadores: ' + error.message
        });
    }
});

// API para obtener mensajes entre administrador y entrenador
router.get('/api/mensajes/:adminId/:trainerId', isAuthenticated, async (req, res) => {
    try {
        const { adminId, trainerId } = req.params;
        
        // Verificar que los IDs son válidos
        if (!adminId || !trainerId) {
            return res.status(400).json({
                success: false,
                mensaje: 'Se requieren los IDs de administrador y entrenador'
            });
        }
        
        // Obtener mensajes
        const mensajes = await MensajeAdminEntrenador.getConversation(adminId, trainerId);
        
        // Marcar mensajes como leídos si el usuario es el receptor
        if (req.session.usuario._id.toString() === adminId) {
            await MensajeAdminEntrenador.markAsRead(adminId, trainerId);
        } else if (req.session.usuario._id.toString() === trainerId) {
            await MensajeAdminEntrenador.markAsRead(trainerId, adminId);
        }
        
        return res.status(200).json({
            success: true,
            mensajes
        });
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        return res.status(500).json({
            success: false,
            mensaje: 'Error al obtener mensajes: ' + error.message
        });
    }
});

module.exports = router;
