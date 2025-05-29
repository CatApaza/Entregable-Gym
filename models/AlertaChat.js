const mongoose = require('mongoose');

/**
 * Modelo para guardar las alertas del chat
 * Almacena información sobre las interacciones de los usuarios con el chatbot
 */
const alertaChatSchema = new mongoose.Schema({
    nombreUsuario: {
        type: String,
        required: true,
        trim: true
    },
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },
    mensaje: {
        type: String,
        required: true
    },
    nivelInteres: {
        type: String,
        enum: ['rojo', 'amarillo', 'verde'],
        required: true
    },
    emojiInteres: {
        type: String,
        default: '🟢'
    },
    color: {
        type: String,
        default: 'verde'
    },
    hora: {
        type: String
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    atendida: {
        type: Boolean,
        default: false
    },
    comentarios: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('AlertaChat', alertaChatSchema);
