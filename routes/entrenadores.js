const express = require('express');
const router = express.Router();
const entrenadorController = require('../controllers/entrenadorController');
const { estaAutenticado, verificarRol } = require('../middlewares/authMiddleware');

// Rutas básicas para entrenadores (protegidas)
router.get('/ver', estaAutenticado, verificarRol(['entrenador']), entrenadorController.obtenerEntrenador);
router.put('/actualizar', estaAutenticado, verificarRol(['entrenador']), entrenadorController.actualizarEntrenador);

// Ruta para obtener los clientes asociados a un entrenador
router.get('/clientes', estaAutenticado, verificarRol(['entrenador']), entrenadorController.obtenerClientesDelEntrenador);
router.get('/clientes/:entrenadorId', estaAutenticado, verificarRol(['entrenador', 'administrador']), entrenadorController.obtenerClientesDelEntrenador);

// Ruta para asignar un cliente a un entrenador
router.post('/asignar-cliente', estaAutenticado, verificarRol(['entrenador']), entrenadorController.asignarClienteAEntrenador);

// Ruta para listar todos los entrenadores (para que los clientes puedan elegir)
router.get('/listar', estaAutenticado, entrenadorController.listarEntrenadores);

module.exports = router;