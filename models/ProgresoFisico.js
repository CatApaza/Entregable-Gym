const mongoose = require('mongoose');

const progresoFisicoSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'clientes' },
    fechaRegistro: { type: Date, default: Date.now },
    pesoKg: Number,
    alturaCm: Number,
    imc: Number,
    grasaCorporal: Number,
    musculo: Number,
    observaciones: String
});
  
module.exports = mongoose.model('progreso_fisico', progresoFisicoSchema);