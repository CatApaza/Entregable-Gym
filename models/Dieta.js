const mongoose = require('mongoose');

const dietaSchema = new mongoose.Schema({
    clienteId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Cliente',
        required: false
    },
    entrenadorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Entrenador',
        required: true
    },
    nombre: { 
        type: String, 
        required: true,
        trim: true
    },
    descripcion: { 
        type: String, 
        required: false,
        default: ''
    },
    fechaInicio: { 
        type: Date, 
        default: Date.now
    },
    fechaFin: { 
        type: Date,
        required: false
    },
    comidas: [
      {
        tipoComida: { 
            type: String, 
            required: true,
            enum: ['Desayuno', 'Almuerzo', 'Cena', 'Merienda', 'Snack']
        },
        descripcion: { 
            type: String, 
            required: true
        },
        caloriasEstimadas: { 
            type: Number, 
            default: 0
        }
      }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para actualizar la fecha de modificaciu00f3n
dietaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});
  
module.exports = mongoose.model('Dieta', dietaSchema);