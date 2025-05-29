const express = require('express');
const router = express.Router();
const Entrenador = require('../models/Entrenador');
const Cliente = require('../models/Cliente');
const Rutina = require('../models/Rutina');
const Usuario = require('../models/Usuario');

// Middleware para verificar si es administrador
const esAdministrador = async (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    const usuario = await Usuario.findById(req.session.usuario._id);
    if (!usuario || usuario.tipoUsuario !== 'administrador') {
        return res.status(403).json({ error: 'Acceso denegado' });
    }

    next();
};

// Obtener todos los entrenadores
router.get('/entrenadores', esAdministrador, async (req, res) => {
    try {
        const entrenadores = await Entrenador.find()
            .populate('usuarioId', 'nombre apellido correo telefono estado verificado');
        
        res.json(entrenadores);
    } catch (error) {
        console.error('Error al obtener entrenadores:', error);
        res.status(500).json({ error: 'Error al obtener entrenadores' });
    }
});

// Obtener todos los clientes
router.get('/clientes', esAdministrador, async (req, res) => {
    try {
        const clientes = await Cliente.find()
            .populate('usuarioId', 'nombre apellido correo telefono estado verificado');
        
        res.json(clientes);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

// Obtener todas las rutinas
router.get('/rutinas', esAdministrador, async (req, res) => {
    try {
        const rutinas = await Rutina.find()
            .populate({
                path: 'clienteId',
                populate: {
                    path: 'usuarioId',
                    select: 'nombre apellido'
                }
            })
            .populate({
                path: 'entrenadorId',
                populate: {
                    path: 'usuarioId',
                    select: 'nombre apellido'
                }
            });
        
        res.json(rutinas);
    } catch (error) {
        console.error('Error al obtener rutinas:', error);
        res.status(500).json({ error: 'Error al obtener rutinas' });
    }
});

module.exports = router;
