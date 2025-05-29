const gimnasioConfig = require('../config/gimnasioConfig');

// Controlador para manejar la información del gimnasio
const gimnasioController = {
    // Mostrar la información general del gimnasio
    mostrarInformacion: (req, res) => {
        try {
            res.render('gimnasioInfo', { 
                gimnasio: gimnasioConfig,
                usuario: req.session.usuario || null,
                titulo: 'Información del Gimnasio'
            });
        } catch (error) {
            console.error('Error al mostrar información del gimnasio:', error);
            res.status(500).send('Error al cargar la información del gimnasio');
        }
    },
    
    // Devolver la información del gimnasio en formato JSON para ser consumida por los modales
    obtenerInformacionJSON: (req, res) => {
        try {
            res.json(gimnasioConfig);
        } catch (error) {
            console.error('Error al obtener información del gimnasio en JSON:', error);
            res.status(500).json({ error: 'Error al cargar la información del gimnasio' });
        }
    },

    // Mostrar los planes del gimnasio
    mostrarPlanes: (req, res) => {
        try {
            res.render('planes', { 
                gimnasio: gimnasioConfig,
                planes: gimnasioConfig.planes,
                usuario: req.session.usuario || null,
                titulo: 'Planes y Precios'
            });
        } catch (error) {
            console.error('Error al mostrar planes del gimnasio:', error);
            res.status(500).send('Error al cargar los planes del gimnasio');
        }
    },

    // Mostrar la información de contacto
    mostrarContacto: (req, res) => {
        try {
            res.render('contacto', { 
                gimnasio: gimnasioConfig,
                contacto: gimnasioConfig.contacto,
                direccion: gimnasioConfig.direccion,
                horarios: gimnasioConfig.horarios,
                usuario: req.session.usuario || null,
                titulo: 'Contacto'
            });
        } catch (error) {
            console.error('Error al mostrar contacto del gimnasio:', error);
            res.status(500).send('Error al cargar la información de contacto');
        }
    }
};

module.exports = gimnasioController;
