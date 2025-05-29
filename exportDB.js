const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('./config');

// Crear directorio de backup si no existe
const backupDir = path.join(__dirname, 'backup');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// Conectar a la base de datos
const connectionString = `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`;
mongoose.connect(connectionString)
    .then(async () => {
        console.log('Conectado a MongoDB. Iniciando exportación...');
        
        // Obtener todas las colecciones
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        // Exportar cada colección
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`Exportando colección: ${collectionName}`);
            
            // Obtener todos los documentos de la colección
            const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
            
            // Guardar en un archivo JSON
            const filePath = path.join(backupDir, `${collectionName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
            
            console.log(`Exportados ${documents.length} documentos a ${filePath}`);
        }
        
        console.log('Exportación completada. Los archivos se encuentran en la carpeta "backup"');
        mongoose.connection.close();
    })
    .catch(error => {
        console.error('Error durante la exportación:', error);
        process.exit(1);
    });
