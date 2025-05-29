const mongoose = require('mongoose');

const ejercicioSchema = new mongoose.Schema({
    nombre: String,
    descripcion: String,
    musculoPrincipal: String,
    equipoNecesario: String
});
  
module.exports = mongoose.model('ejercicios', ejercicioSchema);