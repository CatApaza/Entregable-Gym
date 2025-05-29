const express = require('express');
const router = express.Router();
const Entrenador = require('../models/Entrenador');
const Usuario = require('../models/Usuario');

/**
 * Ruta simplificada para obtener entrenadores directamente sin verificaciones adicionales
 * para el uso específico del chat del administrador
 */
router.get('/lista-directa', async (req, res) => {
    try {
        console.log('Obteniendo entrenadores directamente para el chat del administrador...');
        
        // Primero intentar obtener entrenadores con populate
        const entrenadores = await Entrenador.find({})
            .populate('usuarioId', 'nombre apellido email');
        
        console.log(`Se encontraron ${entrenadores.length} entrenadores en la BD`);
        
        // Si no hay entrenadores o si los entrenadores no tienen usuarioId populado, obtener de otra manera
        if (entrenadores.length === 0 || !entrenadores[0].usuarioId) {
            console.log('Buscando entrenadores por rol en usuarios...');
            const usuariosEntrenadores = await Usuario.find({ rol: 'entrenador' });
            
            if (usuariosEntrenadores && usuariosEntrenadores.length > 0) {
                console.log(`Se encontraron ${usuariosEntrenadores.length} usuarios con rol entrenador`);
                const entrenadoresData = usuariosEntrenadores.map(usuario => ({
                    _id: usuario._id,
                    nombre: usuario.nombre,
                    apellido: usuario.apellido,
                    email: usuario.email || '',
                    especialidad: '',
                    online: false
                }));
                
                return res.status(200).json({
                    success: true,
                    entrenadores: entrenadoresData
                });
            }
        }
        
        // Si hay entrenadores con usuarioId populado, retornarlos en el formato esperado
        const entrenadoresData = entrenadores.map(entrenador => {
            // Verificar si usuarioId está populado correctamente
            if (entrenador.usuarioId && typeof entrenador.usuarioId === 'object') {
                return {
                    _id: entrenador.usuarioId._id,
                    nombre: entrenador.usuarioId.nombre,
                    apellido: entrenador.usuarioId.apellido,
                    email: entrenador.usuarioId.email || '',
                    especialidad: entrenador.especialidad || '',
                    online: false
                };
            } else {
                // Si no está populado, usar directamente el ID
                return {
                    _id: entrenador.usuarioId || entrenador._id,
                    nombre: "Entrenador",
                    apellido: String(entrenador._id).substring(0, 5),
                    email: '',
                    especialidad: entrenador.especialidad || '',
                    online: false
                };
            }
        });
        
        // Como último recurso si no hay datos, crear un entrenador de prueba
        if (entrenadoresData.length === 0) {
            console.log('No se encontraron entrenadores, creando datos de prueba');
            entrenadoresData.push({
                _id: '123456789012',
                nombre: 'Entrenador',
                apellido: 'Prueba',
                email: 'entrenador@ejemplo.com',
                especialidad: 'General',
                online: false
            });
        }
        
        return res.status(200).json({
            success: true,
            entrenadores: entrenadoresData
        });
    } catch (error) {
        console.error('Error al obtener lista de entrenadores directa:', error);
        return res.status(500).json({
            success: false,
            mensaje: 'Error al obtener lista de entrenadores: ' + error.message,
            entrenadores: [{
                _id: 'error-fallback',
                nombre: 'Error',
                apellido: 'Temporal',
                email: '',
                especialidad: 'Contacte administrador',
                online: false
            }]
        });
    }
});

module.exports = router;
