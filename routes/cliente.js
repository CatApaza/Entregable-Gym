const express = require('express');
const router = express.Router();
const { verificarCliente } = require('../middlewares/verificarClienteMiddleware');
const { estaAutenticado, verificarRol } = require('../middlewares/authMiddleware');
const clienteController = require('../controllers/clienteController');

// Rutas protegidas para clientes (requieren autenticación y rol de cliente)

// Obtener datos del cliente actual
router.get('/ver', estaAutenticado, verificarRol(['cliente']), verificarCliente, clienteController.obtenerCliente);

// Actualizar datos del cliente actual
router.put('/actualizar', estaAutenticado, verificarRol(['cliente']), verificarCliente, clienteController.actualizarCliente);

// Ruta para acceder a la página de ejercicios
router.get('/ejercicios', estaAutenticado, verificarRol(['cliente']), verificarCliente, (req, res) => {
    console.log('Renderizando página de ejercicios para cliente:', req.cliente._id);
    res.render('ejercicios', { cliente: req.cliente });
});

// Ruta para acceder a la página de mi entrenador
router.get('/mientrenador', estaAutenticado, verificarRol(['cliente']), verificarCliente, (req, res) => {
    console.log('Renderizando página de mi entrenador para cliente:', req.cliente._id);
    res.render('mientrenador', { cliente: req.cliente });
});

// Ruta para acceder a la página de dietas
router.get('/dietas', estaAutenticado, verificarRol(['cliente']), verificarCliente, (req, res) => {
    console.log('Renderizando página de dietas para cliente:', req.cliente._id);
    res.render('dietas', { cliente: req.cliente });
});

// Ruta para listar todos los clientes (para administradores y entrenadores)
router.get('/listar', estaAutenticado, verificarRol(['administrador', 'entrenador']), clienteController.listarClientes);

// Ruta para que un cliente seleccione un entrenador
router.post('/:clienteId/seleccionar-entrenador', estaAutenticado, verificarRol(['cliente']), verificarCliente, clienteController.seleccionarEntrenador);

module.exports = router;
