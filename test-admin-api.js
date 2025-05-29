// Script para probar las rutas API del panel de administrador
const fetch = require('node-fetch');

async function testAdminAPI() {
    try {
        console.log('Probando API de entrenadores...');
        const entrenadoresResponse = await fetch('http://localhost:3001/api/admin/entrenadores');
        const entrenadores = await entrenadoresResponse.json();
        console.log(`Se encontraron ${entrenadores.length} entrenadores`);
        
        console.log('\nProbando API de clientes...');
        const clientesResponse = await fetch('http://localhost:3001/api/admin/clientes');
        const clientes = await clientesResponse.json();
        console.log(`Se encontraron ${clientes.length} clientes`);
        
        console.log('\nProbando API de rutinas...');
        const rutinasResponse = await fetch('http://localhost:3001/api/admin/rutinas');
        const rutinas = await rutinasResponse.json();
        console.log(`Se encontraron ${rutinas.length} rutinas`);
        
        console.log('\nPruebas completadas con éxito!');
    } catch (error) {
        console.error('Error durante las pruebas:', error);
    }
}

// Ejecutar las pruebas
testAdminAPI();
