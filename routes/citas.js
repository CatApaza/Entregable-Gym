const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

// Ruta para mostrar formulario de creación de cita (cliente)
router.get('/crear/:clienteId', (req, res) => citaController.mostrarFormularioCrearCita(req, res));

// Ruta para crear una nueva cita
router.post('/crear', (req, res) => citaController.crearCita(req, res));

// Ruta para verificar disponibilidad del entrenador
router.get('/verificar-disponibilidad', (req, res) => citaController.verificarDisponibilidad(req, res));

// Ruta para ver citas de un cliente específico
router.get('/cliente/:clienteId', (req, res) => citaController.listarCitasCliente(req, res));

// Ruta para ver citas de un entrenador específico
router.get('/entrenador/:entrenadorId', (req, res) => citaController.listarCitasEntrenador(req, res));

// Ruta para ver detalles de una cita específica
router.get('/:id', (req, res) => citaController.verDetalleCita(req, res));

// Ruta para cambiar el estado de una cita
router.put('/:id/estado', (req, res) => citaController.cambiarEstadoCita(req, res));

// Ruta para eliminar una cita
router.delete('/:id', (req, res) => citaController.eliminarCita(req, res));

module.exports = router;
