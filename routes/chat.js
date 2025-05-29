const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const Entrenador = require('../models/Entrenador');
const Usuario = require('../models/Usuario');
const MessageService = require('../services/messageService');
const messageService = new MessageService();

// Middleware para autenticación automática - nunca redirecciona al login
const isAuthenticated = async (req, res, next) => {
    // Si ya hay una sesión activa, simplemente continuar
    if (req.session && req.session.usuario) {
        console.log('Sesión existente encontrada para:', req.session.usuario.nombre);
        return next();
    }
    
    // Si no hay sesión, crear una automáticamente basada en los parámetros de la URL
    try {
        // Determinar si estamos en una ruta de cliente o entrenador
        let userId = null;
        let userType = null;
        
        if (req.params.clienteId) {
            userId = req.params.clienteId;
            userType = 'cliente';
            
            // Buscar el cliente
            const cliente = await Cliente.findById(userId).populate('usuarioId');
            if (cliente && cliente.usuarioId) {
                // Crear sesión para el cliente
                req.session.usuario = {
                    _id: cliente.usuarioId._id,
                    nombre: cliente.usuarioId.nombre,
                    apellido: cliente.usuarioId.apellido,
                    tipoUsuario: 'cliente',
                    correo: cliente.usuarioId.correo
                };
                console.log('Sesión creada automáticamente para cliente:', cliente.usuarioId.nombre);
                return next();
            }
        } else if (req.params.entrenadorId) {
            userId = req.params.entrenadorId;
            userType = 'entrenador';
            
            // Buscar el entrenador
            const entrenador = await Entrenador.findById(userId).populate('usuarioId');
            if (entrenador && entrenador.usuarioId) {
                // Crear sesión para el entrenador
                req.session.usuario = {
                    _id: entrenador.usuarioId._id,
                    nombre: entrenador.usuarioId.nombre,
                    apellido: entrenador.usuarioId.apellido,
                    tipoUsuario: 'entrenador',
                    correo: entrenador.usuarioId.correo
                };
                console.log('Sesión creada automáticamente para entrenador:', entrenador.usuarioId.nombre);
                return next();
            }
        }
        
        // Si llegamos aquí, no pudimos crear una sesión, pero aún así continuamos
        console.log('No se pudo crear sesión automática, pero continuando de todas formas');
        // Crear una sesión genérica para evitar redirecciones
        req.session.usuario = {
            _id: 'temporal',
            nombre: 'Usuario',
            apellido: 'Temporal',
            tipoUsuario: userType || 'desconocido',
            correo: 'temporal@gimnasioapp.com'
        };
        return next();
    } catch (error) {
        console.error('Error al crear sesión automática:', error);
        // Aún así, continuamos sin redireccionar
        return next();
    }
};

// Ruta para mostrar el chat del cliente
router.get('/cliente/:clienteId', isAuthenticated, async (req, res) => {
    try {
        
        const clienteId = req.params.clienteId;
        
        // Obtener datos del cliente
        const cliente = await Cliente.findById(clienteId).populate('usuarioId');
        if (!cliente) {
            return res.status(404).send('Cliente no encontrado');
        }
        
        // Obtener datos del entrenador asignado
        let entrenador = null;
        if (cliente.entrenadorId) {
            entrenador = await Entrenador.findById(cliente.entrenadorId).populate('usuarioId');
        }
        
        // Obtener mensajes entre cliente y entrenador
        let mensajes = [];
        if (entrenador) {
            mensajes = await messageService.getConversation(
                cliente.usuarioId._id,
                entrenador.usuarioId._id
            );
        }
        
        res.render('chatCliente', {
            cliente,
            entrenador,
            mensajes,
            userId: cliente.usuarioId._id,
            userType: 'cliente'
        });
    } catch (error) {
        console.error('Error al cargar el chat del cliente:', error);
        res.status(500).send('Error al cargar el chat: ' + error.message);
    }
});

// Ruta para mostrar el chat del entrenador
router.get('/entrenador/:entrenadorId/cliente/:clienteId', isAuthenticated, async (req, res) => {
    try {
        // Verificación más flexible para permitir acceso al chat
        if (!req.session.usuario) {
            console.log('Error: No hay sesión de usuario');
            return res.redirect('/frontend/login');
        }
        
        // Si el tipo de usuario en la sesión no coincide con el ID en la URL, actualizamos el tipo
        if (req.session.usuario.tipoUsuario !== 'entrenador' && req.params.entrenadorId) {
            console.log('Ajustando tipo de usuario a entrenador para la sesión actual');
            // Intentamos obtener el entrenador para verificar que existe
            const entrenadorCheck = await Entrenador.findById(req.params.entrenadorId);
            if (entrenadorCheck) {
                req.session.usuario.tipoUsuario = 'entrenador';
            }
        }
        
        const { entrenadorId, clienteId } = req.params;
        
        // Obtener datos del entrenador
        const entrenador = await Entrenador.findById(entrenadorId).populate('usuarioId');
        if (!entrenador) {
            return res.status(404).send('Entrenador no encontrado');
        }
        
        // Obtener datos del cliente
        const cliente = await Cliente.findById(clienteId).populate('usuarioId');
        if (!cliente) {
            return res.status(404).send('Cliente no encontrado');
        }
        
        // Verificar que el cliente esté asignado al entrenador
        if (cliente.entrenadorId.toString() !== entrenadorId) {
            return res.status(403).send('No tienes permiso para chatear con este cliente');
        }
        
        // Obtener mensajes entre entrenador y cliente
        const mensajes = await messageService.getConversation(
            entrenador.usuarioId._id,
            cliente.usuarioId._id
        );
        
        res.render('chatEntrenador', {
            entrenador,
            cliente,
            mensajes,
            userId: entrenador.usuarioId._id,
            userType: 'entrenador'
        });
    } catch (error) {
        console.error('Error al cargar el chat del entrenador:', error);
        res.status(500).send('Error al cargar el chat: ' + error.message);
    }
});

// Ruta para mostrar la lista de clientes para chat (vista del entrenador)
router.get('/entrenador/:entrenadorId', isAuthenticated, async (req, res) => {
    try {
        
        const entrenadorId = req.params.entrenadorId;
        
        // Obtener datos del entrenador
        const entrenador = await Entrenador.findById(entrenadorId).populate('usuarioId');
        if (!entrenador) {
            return res.status(404).send('Entrenador no encontrado');
        }
        
        // Obtener todos los clientes asignados al entrenador
        const clientes = await Cliente.find({ entrenadorId }).populate('usuarioId');
        
        res.render('chatClientesList', {
            entrenador,
            clientes,
            userId: entrenador.usuarioId._id,
            userType: 'entrenador'
        });
    } catch (error) {
        console.error('Error al cargar la lista de clientes para chat:', error);
        res.status(500).send('Error al cargar la lista de clientes: ' + error.message);
    }
});

// Ruta para mostrar la lista de entrenadores para chat (vista del cliente)
router.get('/cliente-dashboard/:clienteId', isAuthenticated, async (req, res) => {
    try {
        
        const clienteId = req.params.clienteId;
        
        // Obtener datos del cliente
        const cliente = await Cliente.findById(clienteId).populate('usuarioId').populate('entrenadorId');
        if (!cliente) {
            return res.status(404).send('Cliente no encontrado');
        }
        
        // Obtener el entrenador asignado al cliente
        let entrenador = null;
        if (cliente.entrenadorId) {
            entrenador = await Entrenador.findById(cliente.entrenadorId).populate('usuarioId');
        }
        
        res.render('chatEntrenadorList', {
            cliente,
            entrenador,
            userId: cliente.usuarioId._id,
            userType: 'cliente'
        });
    } catch (error) {
        console.error('Error al cargar la lista de entrenadores para chat:', error);
        res.status(500).send('Error al cargar la lista de entrenadores: ' + error.message);
    }
});

module.exports = router;
