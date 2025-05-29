const express = require('express');
const router = express.Router();
const gimnasioController = require('../controllers/gimnasioController');

// Rutas públicas para ver información del gimnasio
router.get('/info', gimnasioController.mostrarInformacion);
router.get('/info/data', gimnasioController.obtenerInformacionJSON);
router.get('/planes', gimnasioController.mostrarPlanes);
router.get('/contacto', gimnasioController.mostrarContacto);

// Ruta por defecto que redirige a la información
router.get('/', (req, res) => {
    res.redirect('/gimnasio/info');
});

module.exports = router;
