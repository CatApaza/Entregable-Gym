const express = require('express');
const router = express.Router();
const rutinaController = require('../controllers/rutinaController');

// Rutas para gestión de rutinas
router.post('/crear', (req, res) => rutinaController.crearRutina(req, res));
router.put('/asignar', (req, res) => rutinaController.asignarRutina(req, res));
router.post('/:id/asignar', (req, res) => rutinaController.asignarRutinaPost(req, res));

// Nueva ruta para mostrar la página de asignación de rutinas durante la creación
router.get('/asignar/:id', (req, res) => rutinaController.mostrarPaginaAsignarRutinaCreacion(req, res));

// Rutas para obtener rutinas por cliente
router.get('/cliente/:clienteId', (req, res) => rutinaController.obtenerRutinasPorCliente(req, res));

// Ruta para ver las rutinas asignadas a un cliente específico (vista para entrenadores)
router.get('/cliente/:clienteId/asignadas/:entrenadorId', async (req, res) => {
    try {
        const { clienteId, entrenadorId } = req.params;
        
        // Obtener datos del cliente
        const Cliente = require('../models/Cliente');
        const cliente = await Cliente.findById(clienteId).populate('usuarioId');
        
        if (!cliente) {
            return res.status(404).send('Cliente no encontrado');
        }
        
        // Verificar que el cliente pertenezca al entrenador
        if (cliente.entrenadorId.toString() !== entrenadorId) {
            return res.status(403).send('No tienes permiso para ver las rutinas de este cliente');
        }
        
        // Obtener las rutinas asignadas al cliente
        const rutinaService = require('../services/rutinaService');
        const rutinas = await rutinaService.obtenerRutinasPorCliente(clienteId);
        
        // Renderizar la vista con los datos
        res.render('rutinasAsignadas', {
            cliente: {
                nombre: cliente.usuarioId.nombre,
                apellido: cliente.usuarioId.apellido,
                correo: cliente.usuarioId.correo,
                objetivo: cliente.objetivo
            },
            rutinas,
            entrenadorId
        });
    } catch (error) {
        console.error('Error al mostrar rutinas asignadas:', error);
        res.status(500).send('Error al cargar las rutinas asignadas: ' + error.message);
    }
});

// Ruta para listar rutinas disponibles para asignar
router.get('/disponibles/:entrenadorId', (req, res) => rutinaController.listarRutinasDisponiblesParaAsignar(req, res));

// Ruta para mostrar la página de asignación de rutinas
router.get('/:rutinaId/asignar/:entrenadorId', async (req, res) => {
    try {
        const { rutinaId, entrenadorId } = req.params;
        
        // Obtener la rutina
        const rutinaService = require('../services/rutinaService');
        const rutina = await rutinaService.obtenerRutina(rutinaId);
        if (!rutina) {
            return res.status(404).send('Rutina no encontrada');
        }
        
        // Verificar que la rutina pertenezca al entrenador
        if (rutina.entrenadorId.toString() !== entrenadorId) {
            return res.status(403).send('No tienes permiso para asignar esta rutina');
        }
        
        // Obtener los clientes del entrenador
        const Cliente = require('../models/Cliente');
        const clientes = await Cliente.find({ entrenadorId }).populate('usuarioId', 'nombre apellido');
        
        // Preparar los datos de los clientes para la vista
        const clientesData = clientes.map(cliente => ({
            _id: cliente._id,
            nombre: cliente.usuarioId.nombre,
            apellido: cliente.usuarioId.apellido
        }));
        
        // Renderizar la vista
        res.render('asignarRutina', {
            rutina,
            clientes: clientesData,
            entrenadorId
        });
    } catch (error) {
        console.error('Error al mostrar página de asignación de rutina:', error);
        res.status(500).send('Error al cargar la página de asignación: ' + error.message);
    }
});

// Ruta para obtener el formulario de edición de una rutina
router.get('/:id/editar', (req, res) => rutinaController.mostrarFormularioEdicion(req, res));

// Ruta para ver detalles de una rutina
router.get('/:id', (req, res) => rutinaController.obtenerRutina(req, res));

// Ruta para listar rutinas (con filtros opcionales)
router.get('/', (req, res) => rutinaController.listarRutinas(req, res));

// Ruta para actualizar una rutina
router.put('/:id', (req, res) => rutinaController.actualizarRutina(req, res));

// Ruta para actualizar una rutina vía POST (para formularios HTML)
router.post('/:id', (req, res) => rutinaController.actualizarRutina(req, res));

// Rutas para gestionar ejercicios de una rutina
router.post('/:id/ejercicio', (req, res) => rutinaController.agregarEjercicio(req, res));
router.put('/:id/ejercicio/:diaIndex/:ejercicioIndex', (req, res) => rutinaController.editarEjercicio(req, res));
router.delete('/:id/ejercicio/:diaIndex/:ejercicioIndex', (req, res) => rutinaController.eliminarEjercicio(req, res));

// Ruta para eliminar una rutina
router.delete('/:id', (req, res) => rutinaController.eliminarRutina(req, res));

module.exports = router;