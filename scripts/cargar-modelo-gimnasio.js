const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ruta al archivo modelfile
const modelfilePath = path.join(__dirname, '..', 'modelfile-gimnasio');

console.log('Iniciando carga del modelo personalizado para el gimnasio...');
console.log(`Usando modelfile en: ${modelfilePath}`);

// Verificar que el archivo existe
if (!fs.existsSync(modelfilePath)) {
    console.error('Error: No se encontró el archivo modelfile-gimnasio');
    process.exit(1);
}

// Nombre del modelo personalizado
const modelName = 'gimnasio-app';

// Comando para crear el modelo
const comando = `ollama create ${modelName} -f ${modelfilePath}`;

// Ejecutar el comando
exec(comando, (error, stdout, stderr) => {
    if (error) {
        console.error('Error al crear el modelo:', error);
        return;
    }
    
    if (stderr) {
        console.warn('Advertencia:', stderr);
    }
    
    console.log('Salida del comando:');
    console.log(stdout);
    console.log(`\nModelo "${modelName}" creado exitosamente.`);
    console.log('Ahora puedes usar este modelo en la aplicación ChatIA.');
    console.log('Para actualizar el modelo en la aplicación, edita la variable OLLAMA_MODEL en routes/chatIA.js');
});
