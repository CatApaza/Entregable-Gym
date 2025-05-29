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
    crearNuevoAdministrador();
}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
});

async function crearNuevoAdministrador() {
    try {
        // Datos del nuevo administrador
        const datosAdmin = {
            nombre: 'AdminNuevo',
            apellido: 'Sistema',
            correo: 'admin2@gimnasioapp.com', // Nuevo correo
            contrasenia: await bcrypt.hash('admin456', 10), // Nueva contraseña
            telefono: '9876543210',
            fechaNacimiento: new Date('1995-05-15'),
            genero: 'femenino',
            tipoUsuario: 'administrador',
            estado: 'activo',
            verificado: true
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
            nivel: 'admin',
            permisos: {
                gestionUsuarios: true,
                gestionEntrenadores: true,
                gestionClientes: true,
                gestionRutinas: true,
                gestionPagos: true,
                configuracionSistema: true
            },
            ultimoAcceso: new Date()
        });

        await administrador.save();

        console.log('Nuevo Administrador creado exitosamente:');
        console.log(`Correo: ${datosAdmin.correo}`);
        console.log(`Contraseña: admin456`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error al crear administrador:', error);
        process.exit(1);
    }
}
