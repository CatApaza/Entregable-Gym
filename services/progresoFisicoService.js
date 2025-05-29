const ProgresoFisico = require('../models/ProgresoFisico');

class ProgresoFisicoService {
    async registrarProgreso(data) {
        return await ProgresoFisico.create(data);
    }

    async obtenerProgreso(progresoId) {
        return await ProgresoFisico.findById(progresoId).populate('clienteId');
    }

    async listarProgresos() {
        return await ProgresoFisico.find().populate('clienteId');
    }

    async eliminarProgreso(progresoId) {
        return await ProgresoFisico.findByIdAndDelete(progresoId);
    }
}

module.exports = new ProgresoFisicoService();