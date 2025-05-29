const progresoFisicoService = require('../services/progresoFisicoService');

class ProgresoFisicoController {
    async registrarProgreso(req, res) {
        try {
            const nuevoProgreso = await progresoFisicoService.registrarProgreso(req.body);
            res.status(201).json(nuevoProgreso);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async obtenerProgreso(req, res) {
        try {
            const progreso = await progresoFisicoService.obtenerProgreso(req.params.id);
            res.json(progreso);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async listarProgresos(req, res) {
        try {
            const progresos = await progresoFisicoService.listarProgresos();
            res.json(progresos);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async eliminarProgreso(req, res) {
        try {
            await progresoFisicoService.eliminarProgreso(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ProgresoFisicoController();