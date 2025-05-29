const Ejercicio = require('../models/Ejercicio');

class EjercicioService {
    async crearEjercicio(data) {
        return await Ejercicio.create(data);
    }

    async listarEjercicios() {
        return await Ejercicio.find();
    }

    async eliminarEjercicio(ejercicioId) {
        return await Ejercicio.findByIdAndDelete(ejercicioId);
    }
}

module.exports = new EjercicioService();