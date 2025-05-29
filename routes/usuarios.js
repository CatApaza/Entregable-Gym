const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');  
const { verificarCliente } = require('../middlewares/verificarClienteMiddleware');
const { verificarEntrenador } = require('../middlewares/verificarEntrenadorMiddleware');
const { estaAutenticado, verificarRol } = require('../middlewares/authMiddleware');

// Ruta pública para registro de usuarios
router.post('/registrar', UsuarioController.crearUsuario);

// Ruta para obtener el perfil del usuario actual (requiere autenticación)
router.get('/perfil', estaAutenticado, UsuarioController.obtenerPerfil);

// Ruta para actualizar el perfil del usuario actual (requiere autenticación)
router.put('/actualizar', estaAutenticado, UsuarioController.actualizarPerfil);

module.exports = router;
