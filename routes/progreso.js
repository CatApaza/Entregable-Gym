const express = require('express');
const router = express.Router();
const progresoFisicoController = require('../controllers/progresoController');

router.post('/registrar', (req, res) => progresoFisicoController.registrarProgreso(req, res));
router.get('/:id', (req, res) => progresoFisicoController.obtenerProgreso(req, res));
router.get('/', (req, res) => progresoFisicoController.listarProgresos(req, res));
router.delete('/:id', (req, res) => progresoFisicoController.eliminarProgreso(req, res));

module.exports = router;