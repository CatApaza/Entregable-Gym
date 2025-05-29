const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const Entrenador = require('../models/Entrenador');

// Ruta para obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.find({});
        res.json({
            success: true,
            count: usuarios.length,
            data: usuarios
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para obtener todos los clientes
router.get('/clientes', async (req, res) => {
    try {
        const clientes = await Cliente.find({}).populate('usuarioId');
        res.json({
            success: true,
            count: clientes.length,
            data: clientes
        });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para obtener lista simple de clientes para asignar
router.get('/clientes/lista', async (req, res) => {
    try {
        // Obtener el ID del entrenador de la sesión si está disponible
        const entrenadorId = req.session?.usuario?._id;
        
        let clientes = [];
        
        // Si hay un ID de entrenador en la sesión, filtrar por ese entrenador
        if (entrenadorId) {
            // Primero obtener el entrenador
            const entrenador = await Entrenador.findOne({ usuarioId: entrenadorId });
            if (entrenador) {
                clientes = await Cliente.find({ entrenadorId: entrenador._id });
            } else {
                // Si no se encuentra el entrenador, devolver todos los clientes
                clientes = await Cliente.find({});
            }
        } else {
            // Si no hay ID de entrenador, devolver todos los clientes
            clientes = await Cliente.find({});
        }
        
        // Devolver la lista simple de clientes
        res.json(clientes);
    } catch (error) {
        console.error('Error al obtener lista de clientes:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

// Ruta para obtener todos los entrenadores
router.get('/entrenadores', async (req, res) => {
    try {
        const entrenadores = await Entrenador.find({}).populate('usuarioId');
        res.json({
            success: true,
            count: entrenadores.length,
            data: entrenadores
        });
    } catch (error) {
        console.error('Error al obtener entrenadores:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Ruta para verificar el estado de la base de datos
router.get('/status', async (req, res) => {
    try {
        const usuariosCount = await Usuario.countDocuments();
        const clientesCount = await Cliente.countDocuments();
        const entrenadoresCount = await Entrenador.countDocuments();
        
        res.json({
            success: true,
            database: 'conectada',
            counts: {
                usuarios: usuariosCount,
                clientes: clientesCount,
                entrenadores: entrenadoresCount
            }
        });
    } catch (error) {
        console.error('Error al verificar estado de la base de datos:', error);
        res.status(500).json({
            success: false,
            database: 'error',
            error: error.message
        });
    }
});

// Ruta para obtener datos del usuario actual de la sesión
router.get('/usuario-actual', (req, res) => {
    try {
        // Verificar si hay un usuario en la sesión
        if (req.session && req.session.usuario) {
            res.json({
                success: true,
                usuario: req.session.usuario
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'No hay usuario autenticado en la sesión'
            });
        }
    } catch (error) {
        console.error('Error al obtener usuario actual:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
