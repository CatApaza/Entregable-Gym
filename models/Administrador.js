const mongoose = require('mongoose');

const administradorSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
    nivel: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
    permisos: {
        gestionUsuarios: { type: Boolean, default: true },
        gestionEntrenadores: { type: Boolean, default: true },
        gestionClientes: { type: Boolean, default: true },
        gestionRutinas: { type: Boolean, default: false },
        gestionPagos: { type: Boolean, default: false },
        configuracionSistema: { type: Boolean, default: false }
    },
    ultimoAcceso: { type: Date },
    codigosGenerados: [{
        codigo: String,
        tipo: { type: String, enum: ['entrenador', 'cliente', 'admin'] },
        fechaCreacion: { type: Date, default: Date.now },
        fechaExpiracion: Date,
        usado: { type: Boolean, default: false },
        usuarioAsignado: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios' }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Administrador', administradorSchema);
