const express = require('express');
const router = express.Router();
const ejercicioController = require('../controllers/ejercicioController');

router.post('/crear', (req, res) => ejercicioController.crearEjercicio(req, res));
router.get('/', (req, res) => ejercicioController.listarEjercicios(req, res));
router.delete('/:id', (req, res) => ejercicioController.eliminarEjercicio(req, res));

module.exports = router;