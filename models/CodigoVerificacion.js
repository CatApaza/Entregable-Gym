const mongoose = require('mongoose');

const codigoVerificacionSchema = new mongoose.Schema({
    codigo: { 
        type: String, 
        required: true, 
        unique: true 
    },
    tipoUsuario: { 
        type: String, 
        enum: ['entrenador', 'cliente', 'administrador'], 
        required: true 
    },
    estado: { 
        type: String, 
        enum: ['activo', 'usado', 'expirado'], 
        default: 'activo' 
    },
    fechaCreacion: { 
        type: Date, 
        default: Date.now 
    },
    fechaExpiracion: { 
        type: Date, 
        required: true 
    },
    creadoPor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'usuarios', 
        required: true 
    },
    usadoPor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'usuarios' 
    },
    fechaUso: Date
}, { timestamps: true });

// Método para verificar si el código ha expirado
codigoVerificacionSchema.methods.haExpirado = function() {
    return new Date() > this.fechaExpiracion;
};

// Método para marcar el código como usado
codigoVerificacionSchema.methods.marcarComoUsado = function(usuarioId) {
    this.estado = 'usado';
    this.usadoPor = usuarioId;
    this.fechaUso = new Date();
    return this.save();
};

module.exports = mongoose.model('CodigoVerificacion', codigoVerificacionSchema);
