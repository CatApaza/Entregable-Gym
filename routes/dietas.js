const express = require('express');
const router = express.Router();
const dietaController = require('../controllers/dietaController');

// Rutas básicas para dietas
router.post('/crear', (req, res) => dietaController.crearDieta(req, res));
router.put('/asignar', (req, res) => dietaController.asignarDieta(req, res));
router.post('/:id/asignar', (req, res) => dietaController.asignarDietaPost(req, res));

// Nueva ruta para mostrar la página de asignación de dietas
router.get('/asignar/:id', (req, res) => dietaController.mostrarPaginaAsignarDieta(req, res));

// Rutas específicas para entrenadores y clientes (deben ir ANTES de las rutas con parámetros)
router.get('/entrenador', (req, res) => dietaController.listarDietasPorEntrenador(req, res));
router.get('/entrenador/:entrenadorId', (req, res) => dietaController.listarDietasPorEntrenador(req, res));
router.get('/cliente/:clienteId', (req, res) => dietaController.listarDietasPorCliente(req, res));

// Rutas con parámetros (deben ir DESPUÉS de las rutas específicas)
router.get('/:id', (req, res) => dietaController.obtenerDieta(req, res));
router.delete('/:id', (req, res) => dietaController.eliminarDieta(req, res));
router.put('/:id', (req, res) => dietaController.actualizarDieta(req, res));

// Ruta para listar todas las dietas
router.get('/', (req, res) => dietaController.listarDietas(req, res));

module.exports = router;