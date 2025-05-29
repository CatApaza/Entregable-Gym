/**
 * Script para generar cu00f3digos de verificaciu00f3n directamente desde la consola
 * Esto es u00fatil cuando la interfaz de usuario no funciona correctamente
 */

const mongoose = require('mongoose');
const CodigoVerificacion = require('../models/CodigoVerificacion');
const Administrador = require('../models/Administrador');
const crypto = require('crypto');

// Conectar a la base de datos
mongoose.connect('mongodb://localhost:27017/gimnasioApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conexiu00f3n a MongoDB establecida');
    generarCodigo();
}).catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
});

async function generarCodigo() {
    try {
        // Buscar el primer administrador en la base de datos
        const admin = await Administrador.findOne();
        
        if (!admin) {
            console.error('No se encontru00f3 ningu00fan administrador en la base de datos');
            process.exit(1);
        }
        
        // Generar un cu00f3digo aleatorio
        const codigo = crypto.randomBytes(4).toString('hex').toUpperCase();
        
        // Crear una fecha de expiraciu00f3n (7 du00edas desde hoy)
        const fechaExpiracion = new Date();
        fechaExpiracion.setDate(fechaExpiracion.getDate() + 7);
        
        // Guardar el cu00f3digo en la base de datos
        const codigoVerificacion = new CodigoVerificacion({
            codigo: codigo,
            tipoUsuario: 'entrenador',
            creadoPor: admin._id,
            fechaCreacion: new Date(),
            fechaExpiracion: fechaExpiracion,
            estado: 'activo'
        });
        
        await codigoVerificacion.save();
        
        console.log('\n=================================================');
        console.log('Cu00d3DIGO DE VERIFICACIu00d3N GENERADO EXITOSAMENTE');
        console.log('=================================================');
        console.log(`Cu00f3digo: ${codigo}`);
        console.log(`Tipo de usuario: entrenador`);
        console.log(`Fecha de creaciu00f3n: ${new Date().toLocaleString()}`);
        console.log(`Fecha de expiraciu00f3n: ${fechaExpiracion.toLocaleString()}`);
        console.log(`Estado: activo`);
        console.log('=================================================');
        console.log('INSTRUCCIONES:');
        console.log('1. Copie este cu00f3digo y compu00e1rtalo con el entrenador');
        console.log('2. El entrenador debe usar este cu00f3digo al registrarse');
        console.log('3. El cu00f3digo expiraru00e1 en 7 du00edas o despuu00e9s de un uso');
        console.log('=================================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('Error al generar cu00f3digo de verificaciu00f3n:', error);
        process.exit(1);
    }
}
