const ejercicioService = require('../services/ejercicioService');

class EjercicioController {
    async crearEjercicio(req, res) {
        try {
            const nuevoEjercicio = await ejercicioService.crearEjercicio(req.body);
            res.status(201).json(nuevoEjercicio);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async listarEjercicios(req, res) {
        try {
            const ejercicios = await ejercicioService.listarEjercicios();
            res.json(ejercicios);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async eliminarEjercicio(req, res) {
        try {
            await ejercicioService.eliminarEjercicio(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new EjercicioController();