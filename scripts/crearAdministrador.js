const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Administrador = require('../models/Administrador');

// Conectar a la base de datos
mongoose.connect('mongodb://localhost:27017/gimnasioApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conexión a MongoDB establecida');
    crearAdministrador();
}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
});

async function crearAdministrador() {
    try {
        // Datos del administrador
        const datosAdmin = {
            nombre: 'Admin',
            apellido: 'Principal',
            correo: 'admin@gimnasioapp.com',
            contrasenia: await bcrypt.hash('admin123', 10), // Contraseña encriptada
            telefono: '1234567890',
            fechaNacimiento: new Date('1990-01-01'),
            genero: 'masculino',
            tipoUsuario: 'administrador',
            estado: 'activo'
        };

        // Verificar si ya existe un usuario con ese correo
        const usuarioExistente = await Usuario.findOne({ correo: datosAdmin.correo });
        
        if (usuarioExistente) {
            console.log('Ya existe un usuario con ese correo. No se creará otro administrador.');
            process.exit(0);
        }

        // Crear el usuario
        const usuario = new Usuario(datosAdmin);
        const usuarioGuardado = await usuario.save();

        // Crear el administrador
        const administrador = new Administrador({
            usuarioId: usuarioGuardado._id,
            permisos: ['verificar_entrenadores', 'gestionar_usuarios', 'generar_codigos'],
            fechaCreacion: new Date()
        });

        await administrador.save();

        console.log('Administrador creado exitosamente:');
        console.log(`Correo: ${datosAdmin.correo}`);
        console.log(`Contraseña: admin123`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error al crear administrador:', error);
        process.exit(1);
    }
}
