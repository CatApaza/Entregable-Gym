const mongoose = require('mongoose');
const {db} = require('../config');

// Opciones de conexión mejoradas
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

// Establecer strictQuery a false para evitar advertencias
mongoose.set('strictQuery', false);

// Crear la URL de conexión
const connectionString = `mongodb://${db.host}:${db.port}/${db.database}`;
console.log('Intentando conectar a MongoDB en:', connectionString);

// Conectar a la base de datos
mongoose.connect(connectionString, options)
    .then(() => {
        console.log('Conexión exitosa a MongoDB');
    })
    .catch((err) => {
        console.error('Error al conectarse a MongoDB:', err.message);
    });

// Eventos de conexión
mongoose.connection.on('connected', () => {
    console.log('Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Error de conexión de Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose desconectado de MongoDB');
});

// Exportar la conexión
module.exports = mongoose.connection;
