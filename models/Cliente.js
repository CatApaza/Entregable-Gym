const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
    entrenadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entrenador' },
    objetivo: String,
    nivel: String,
    observaciones: String,
    fechaAsignacionEntrenador: { type: Date }
});

module.exports = mongoose.model('Cliente', clienteSchema);
