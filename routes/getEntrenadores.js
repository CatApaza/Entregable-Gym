const express = require('express');
const router = express.Router();
const Entrenador = require('../models/Entrenador');
const Usuario = require('../models/Usuario');

// Middleware simplificado para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'No autenticado' });
};

// Ruta para obtener todos los entrenadores disponibles
router.get('/all', isAuthenticated, async (req, res) => {
    try {
        console.log('Obteniendo todos los entrenadores para el chat...');
        
        // Obtener entrenadores con sus datos de usuario
        const entrenadores = await Entrenador.find({})
            .populate('usuarioId', 'nombre apellido email');
        
        console.log(`Se encontraron ${entrenadores.length} entrenadores`);
        
        // Transformar los datos para el formato que espera el chat
        const entrenadoresData = entrenadores.map(entrenador => ({
            _id: entrenador.usuarioId._id,
            nombre: entrenador.usuarioId.nombre,
            apellido: entrenador.usuarioId.apellido,
            email: entrenador.usuarioId.email || '',
            especialidad: entrenador.especialidad || '',
            online: false
        }));
        
        return res.status(200).json({
            success: true,
            entrenadores: entrenadoresData
        });
    } catch (error) {
        console.error('Error al obtener lista de entrenadores:', error);
        return res.status(500).json({
            success: false,
            mensaje: 'Error al obtener lista de entrenadores: ' + error.message
        });
    }
});

module.exports = router;
