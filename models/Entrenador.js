const mongoose = require("mongoose");

const entrenadorSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
    especialidad: String,
    certificaciones: [String],
    experienciaAnios: Number,
    descripcionPerfil: String,
    verificado: { type: Boolean, default: false },
    codigoVerificacion: { type: String },
    fechaVerificacion: Date,
    verificadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' },
    documentosVerificacion: [{
        tipo: { type: String, enum: ['certificado', 'titulo', 'identificacion', 'otro'] },
        nombre: String,
        url: String,
        fechaSubida: { type: Date, default: Date.now }
    }],
    estado: { 
        type: String, 
        enum: ['pendiente', 'activo', 'inactivo', 'suspendido'], 
        default: 'pendiente' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Entrenador', entrenadorSchema);
