const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario');
const { db } = require('./config');

// --- Configuración ---
const userEmail = 'admin2@gimnasioapp.com';
const newPassword = 'GimnasioApp2024!'; // Puedes cambiar esta contraseña si lo deseas
// -------------------

const resetPassword = async () => {
  const connectionString = `mongodb://${db.host}:${db.port}/${db.database}`;

  try {
    console.log(`Intentando conectar a: ${connectionString}`);
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conexión a la base de datos exitosa.');

    const user = await Usuario.findOne({ correo: userEmail });

    if (!user) {
      console.error(`Error: No se encontró ningún usuario con el correo '${userEmail}'.`);
      return;
    }

    console.log(`Usuario encontrado: ${user.nombre} ${user.apellido}`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Nueva contraseña encriptada.');

    user.contrasenia = hashedPassword;
    await user.save();

    console.log(`\n¡Éxito! La contraseña para '${userEmail}' ha sido actualizada.`);
    console.log(`La nueva contraseña es: ${newPassword}`);

  } catch (error) {
    console.error('Ocurrió un error durante el proceso:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de la base de datos.');
  }
};

resetPassword();
