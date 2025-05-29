const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
    clienteId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Cliente',
        required: true 
    },
    entrenadorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Entrenador',
        required: true 
    },
    fecha: { 
        type: Date, 
        required: true 
    },
    horaInicio: { 
        type: String, 
        required: true 
    },
    horaFin: { 
        type: String, 
        required: true 
    },
    estado: { 
        type: String, 
        enum: ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'],
        default: 'Pendiente'
    },
    tipoCita: {
        type: String,
        enum: ['Evaluación', 'Entrenamiento', 'Seguimiento', 'Otro'],
        default: 'Entrenamiento'
    },
    notas: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Cita', citaSchema);
