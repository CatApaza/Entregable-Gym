/**
 * Script para consultar a Ollama desde un proceso separado
 * Este script se ejecuta como un proceso independiente para evitar problemas de SIGTERM
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const OLLAMA_MODEL = process.argv[3] || 'llama3.1:8b';
const PROMPT = process.argv[2];
const OUTPUT_FILE = process.argv[4] || path.join(__dirname, '../temp/ollama_response.txt');

// Verificar que tenemos un prompt
if (!PROMPT) {
    console.error('Error: Se requiere un prompt como primer argumento');
    process.exit(1);
}

// Crear directorio de salida si no existe
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Función para escapar caracteres especiales en el prompt
function escapePrompt(prompt) {
    return prompt.replace(/"/g, '\\"');
}

// Ejecutar Ollama como un proceso separado
console.log(`Consultando a Ollama (modelo: ${OLLAMA_MODEL})...`);
console.log(`Prompt: ${PROMPT.substring(0, 50)}${PROMPT.length > 50 ? '...' : ''}`);

// Comando para ejecutar Ollama
const comando = `ollama run ${OLLAMA_MODEL} "${escapePrompt(PROMPT)}"`;

// Ejecutar el comando
exec(comando, { timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
        console.error('Error al ejecutar Ollama:', error);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
            success: false,
            error: error.message,
            stderr: stderr
        }));
        process.exit(1);
    }
    
    // Guardar la respuesta en el archivo de salida
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
        success: true,
        response: stdout.trim()
    }));
    
    console.log('Respuesta de Ollama guardada en:', OUTPUT_FILE);
    console.log(`Respuesta (primeros 100 caracteres): ${stdout.substring(0, 100)}${stdout.length > 100 ? '...' : ''}`);
    
    process.exit(0);
});
