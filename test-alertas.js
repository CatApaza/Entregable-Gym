/**
 * Script de prueba para verificar que se guarden las alertas del chat
 * Ejecutar con: node test-alertas.js
 */

// Importar dependencias
const mongoose = require('mongoose');
const {db} = require('./config');

// Cargar el modelo de AlertaChat
const AlertaChat = require('./models/AlertaChat');

// Conectar a la base de datos
async function conectarBD() {
    try {
        await mongoose.connect(`mongodb://${db.host}:${db.port}/${db.database}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conexión exitosa a MongoDB');
        return true;
    } catch (error) {
        console.error('❌ Error al conectar a MongoDB:', error.message);
        return false;
    }
}

// Crear una alerta de prueba
async function crearAlertaPrueba() {
    try {
        const alertaDePrueba = new AlertaChat({
            nombreUsuario: 'Usuario de Prueba',
            mensaje: '¿Cuánto cuesta la membresía?',
            nivelInteres: 'rojo',
            emojiInteres: '🔴',
            color: 'rojo',
            hora: new Date().toLocaleTimeString()
        });

        const resultado = await alertaDePrueba.save();
        console.log('✅ Alerta guardada correctamente con ID:', resultado._id);
        console.log('Datos guardados:', resultado);
        return true;
    } catch (error) {
        console.error('❌ Error al guardar la alerta de prueba:', error);
        return false;
    }
}

// Listar las alertas existentes
async function listarAlertas() {
    try {
        const alertas = await AlertaChat.find().sort({ fechaCreacion: -1 }).limit(10);
        console.log(`\n📋 Se encontraron ${alertas.length} alertas en la base de datos:`);
        
        if (alertas.length > 0) {
            alertas.forEach((alerta, index) => {
                console.log(`\n--- Alerta ${index + 1} ---`);
                console.log(`ID: ${alerta._id}`);
                console.log(`Usuario: ${alerta.nombreUsuario}`);
                console.log(`Mensaje: ${alerta.mensaje}`);
                console.log(`Nivel de interés: ${alerta.nivelInteres} ${alerta.emojiInteres}`);
                console.log(`Fecha: ${alerta.fechaCreacion.toLocaleString()}`);
            });
        } else {
            console.log('No hay alertas guardadas en la base de datos.');
        }
    } catch (error) {
        console.error('❌ Error al listar las alertas:', error);
    }
}

// Ejecutar las funciones
async function ejecutar() {
    console.log('🔍 Verificando sistema de alertas del chat...');
    
    // Conectar a la base de datos
    const conectado = await conectarBD();
    if (!conectado) {
        console.error('❌ No se pudo conectar a la base de datos. Abortando prueba.');
        process.exit(1);
    }
    
    // Listar alertas existentes
    await listarAlertas();
    
    // Crear alerta de prueba
    console.log('\n🧪 Creando alerta de prueba...');
    const creada = await crearAlertaPrueba();
    
    if (creada) {
        // Listar alertas después de crear una nueva
        console.log('\n📋 Lista actualizada después de crear la alerta:');
        await listarAlertas();
    }
    
    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('\n👋 Prueba finalizada. Conexión cerrada.');
}

// Iniciar el script
ejecutar();
