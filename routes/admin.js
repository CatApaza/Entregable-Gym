const express = require('express');
const router = express.Router();
const administradorController = require('../controllers/administradorController');

// Middleware para verificar si es administrador
const esAdministrador = async (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.redirect('/frontend/login?error=Debe iniciar sesión');
    }

    const Usuario = require('../models/Usuario');
    const usuario = await Usuario.findById(req.session.usuario._id);

    if (!usuario || usuario.tipoUsuario !== 'administrador') {
        return res.redirect('/frontend/login?error=Acceso no autorizado');
    }

    next();
};

// Rutas del panel de administración
router.get('/dashboard', esAdministrador, (req, res) => administradorController.mostrarPanelAdmin(req, res));

// Rutas para gestión de entrenadores
router.get('/entrenadores', esAdministrador, (req, res) => administradorController.listarEntrenadores(req, res));
router.post('/entrenadores/verificar', esAdministrador, (req, res) => administradorController.verificarEntrenador(req, res));

// Rutas para gestión de clientes
router.get('/clientes', esAdministrador, (req, res) => administradorController.listarClientes(req, res));

// Rutas para gestión de usuarios
router.post('/usuarios/estado', esAdministrador, (req, res) => administradorController.cambiarEstadoUsuario(req, res));

// Rutas para códigos de verificación
router.post('/codigos/generar', esAdministrador, (req, res) => administradorController.generarCodigoVerificacion(req, res));
router.get('/codigos', esAdministrador, (req, res) => administradorController.listarCodigosVerificacion(req, res));
router.post('/codigos/validar', (req, res) => administradorController.validarCodigoVerificacion(req, res));

module.exports = router;
