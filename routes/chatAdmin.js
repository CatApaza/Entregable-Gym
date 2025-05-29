const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MensajeAdminEntrenador = require('../models/MensajeAdminEntrenador');
const Usuario = require('../models/Usuario');

// Middleware para verificar autenticación pero permitir a entrenadores acceder a datos del admin
function chatAuthMiddleware(req, res, next) {
    // Si el usuario está autenticado como entrenador o administrador, permitir acceso
    if (req.session && req.session.usuario) {
        if (req.session.usuario.tipoUsuario === 'entrenador' || 
            req.session.usuario.tipoUsuario === 'administrador') {
            return next();
        }
    }
    
    // Si estamos en modo desarrollo o pruebas, permitir acceso para facilitar testing
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.log('Acceso permitido en modo desarrollo/pruebas');
        return next();
    }
    
    // Si no cumple condiciones, redirigir a login
    console.log('Usuario no autenticado, redirigiendo a /login');
    res.redirect('/login');
}

// Obtener información del administrador (para entrenadores)
router.get('/chat-admin/api/admin-info', async (req, res) => {
    try {
        // Buscar al administrador en la base de datos
        const admin = await Usuario.findOne({ tipoUsuario: 'administrador' });
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                mensaje: 'No se encontró ningún administrador'
            });
        }
        
        // Registrar para depuración
        console.log('Administrador encontrado:', admin._id, admin.nombre, admin.apellido);
        
        // Devolver información básica del administrador en el formato esperado
        res.json({
            success: true,
            adminId: admin._id,
            nombre: admin.nombre,
            apellido: admin.apellido
        });
    } catch (error) {
        console.error('Error al obtener información del administrador:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener información del administrador',
            error: error.message
        });
    }
});

// Obtener mensajes entre administrador y entrenador
router.get('/chat-admin/api/mensajes/:adminId/:trainerId', chatAuthMiddleware, async (req, res) => {
    try {
        const { adminId, trainerId } = req.params;
        
        // Validar que los IDs sean válidos de MongoDB
        if (!mongoose.Types.ObjectId.isValid(adminId) || !mongoose.Types.ObjectId.isValid(trainerId)) {
            return res.status(400).json({
                success: false,
                mensaje: 'IDs de administrador o entrenador inválidos'
            });
        }
        
        // Obtener mensajes de la base de datos
        const mensajes = await MensajeAdminEntrenador.getConversation(adminId, trainerId);
        
        res.json({
            success: true,
            mensajes
        });
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener mensajes',
            error: error.message
        });
    }
});

module.exports = router;
