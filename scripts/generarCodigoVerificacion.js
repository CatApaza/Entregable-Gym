const mongoose = require('mongoose');
const CodigoVerificacion = require('../models/CodigoVerificacion');
require('dotenv').config();

// Conectar a la base de datos
const connection = require('../database/connection');

// Función para generar un código aleatorio
function generarCodigo(longitud = 8) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < longitud; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

// Función para crear un nuevo código de verificación
async function crearCodigoVerificacion() {
    try {
        // ID del administrador (deberías tener al menos un usuario administrador en tu base de datos)
        // Puedes cambiar este ID por el ID real de un administrador en tu sistema
        const adminId = '6462d8f3e4b0a4e8c9f7b3a1'; // Este es un ID de ejemplo, cámbialo por un ID real
        
        // Generar un código único
        const codigo = generarCodigo();
        
        // Fecha de expiración (30 días a partir de hoy)
        const fechaExpiracion = new Date();
        fechaExpiracion.setDate(fechaExpiracion.getDate() + 30);
        
        // Crear el código de verificación
        const nuevoCodigoVerificacion = new CodigoVerificacion({
            codigo,
            tipoUsuario: 'entrenador',
            estado: 'activo',
            fechaExpiracion,
            creadoPor: adminId
        });
        
        // Guardar en la base de datos
        await nuevoCodigoVerificacion.save();
        
        console.log(`Código de verificación creado: ${codigo}`);
        console.log(`Expira el: ${fechaExpiracion.toLocaleDateString()}`);
        
        return codigo;
    } catch (error) {
        console.error('Error al crear código de verificación:', error);
        throw error;
    }
}

// Ejecutar la función
crearCodigoVerificacion()
    .then(codigo => {
        console.log('Proceso completado exitosamente');
        process.exit(0);
    })
    .catch(error => {
        console.error('Error en el proceso:', error);
        process.exit(1);
    });
