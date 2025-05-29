const mongoose = require('mongoose');

const rutinaSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
    entrenadorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entrenador' },
    nombre: String,
    descripcion: String,
    duracionSemanas: Number,
    fechaInicio: Date,
    fechaFin: Date,
    estado: String,
    ejercicios: [
      {
        diaSemana: String,
        ejercicios: [
          {
            nombre: String,
            series: Number,
            repeticiones: Number,
            descansoSegundos: Number
          }
        ]
      }
    ]
});
  
module.exports = mongoose.model('Rutina', rutinaSchema);