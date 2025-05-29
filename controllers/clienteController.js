const express = require('express');
const ClienteService = require('../services/clienteService')

exports.obtenerCliente = async (req, res) => {
    try {
        const cliente = await ClienteService.obtenerClientePorUsuario(req.user.id);
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(cliente);
    } catch (error) {
        console.error('Error al obtener los datos del cliente:', error.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

exports.actualizarCliente = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const datosActualizados = req.body;

        const clienteActualizado = await ClienteService.actualizarCliente(usuarioId, datosActualizados);

        if(!clienteActualizado){
            return res.status(404).json({ error:'Cliente no encontrado' })
        }
        res.json({ mensaje: 'Datos del cliente actualizados correctamente' });
    } catch (error) {
        console.error('Error al actualizar los datos del cliente:', error.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Listar todos los clientes (para administradores)
exports.listarClientes = async (req, res) => {
    try {
        console.log('Listando todos los clientes');
        
        // Si es un entrenador, solo mostrar sus clientes asignados
        if (req.user && req.user.tipoUsuario === 'entrenador') {
            const EntrenadorService = require('../services/entrenadorService');
            const entrenador = await EntrenadorService.obtenerEntrenadorPorUsuario(req.user.id);
            
            if (entrenador) {
                const clientes = await ClienteService.obtenerClientesPorEntrenador(entrenador._id);
                return res.json(clientes);
            }
        }
        
        // Si es administrador o caso por defecto, mostrar todos los clientes
        const clientes = await ClienteService.obtenerAllCliente();
        
        // Poblar los datos de usuario para cada cliente
        const clientesConUsuarios = await Promise.all(
            clientes.map(async (cliente) => {
                const clienteObj = cliente.toObject();
                if (clienteObj.usuarioId) {
                    // Obtener datos del usuario asociado al cliente
                    try {
                        const Usuario = require('../models/Usuario');
                        const usuario = await Usuario.findById(clienteObj.usuarioId);
                        if (usuario) {
                            // Eliminar información sensible
                            const usuarioObj = usuario.toObject();
                            delete usuarioObj.contrasenia;
                            clienteObj.usuario = usuarioObj;
                        }
                    } catch (err) {
                        console.error('Error al obtener usuario para cliente:', err);
                    }
                }
                
                // Obtener datos del entrenador si existe
                if (clienteObj.entrenadorId) {
                    try {
                        const Entrenador = require('../models/Entrenador');
                        const entrenador = await Entrenador.findById(clienteObj.entrenadorId).populate('usuarioId');
                        if (entrenador && entrenador.usuarioId) {
                            clienteObj.entrenador = {
                                _id: entrenador._id,
                                nombre: entrenador.usuarioId.nombre,
                                apellido: entrenador.usuarioId.apellido,
                                correo: entrenador.usuarioId.correo,
                                especialidad: entrenador.especialidad
                            };
                        }
                    } catch (err) {
                        console.error('Error al obtener entrenador para cliente:', err);
                    }
                }
                
                return clienteObj;
            })
        );
        
        res.json(clientesConUsuarios);
    } catch (error) {
        console.error('Error al listar clientes:', error.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Seleccionar un entrenador para un cliente
exports.seleccionarEntrenador = async (req, res) => {
    try {
        console.log('Iniciando selección de entrenador...');
        console.log('Datos recibidos:', { params: req.params, body: req.body, user: req.user ? req.user.id : 'No hay usuario' });
        
        // Obtener el ID del cliente de manera más segura
        let clienteId = req.params.clienteId;
        const { entrenadorId } = req.body;
        
        if (!entrenadorId) {
            console.error('ID de entrenador no proporcionado');
            return res.status(400).json({ error: 'ID de entrenador no proporcionado' });
        }
        
        // Si no hay clienteId en la URL, intentar obtenerlo del usuario autenticado
        if (!clienteId && req.user && req.user.id) {
            console.log('Buscando cliente por usuario:', req.user.id);
            const ClienteService = require('../services/clienteService');
            const clientePorUsuario = await ClienteService.obtenerClientePorUsuario(req.user.id);
            
            if (clientePorUsuario) {
                clienteId = clientePorUsuario._id.toString();
                console.log('Cliente encontrado por usuario:', clienteId);
            }
        }
        
        if (!clienteId) {
            console.error('No se pudo determinar el ID del cliente');
            return res.status(400).json({ error: 'ID de cliente no disponible' });
        }
        
        // Comprobar si el cliente ya tiene un entrenador asignado
        const Cliente = require('../models/Cliente');
        const cliente = await Cliente.findById(clienteId);
        
        if (!cliente) {
            console.error(`Cliente con ID ${clienteId} no encontrado`);
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        if (cliente.entrenadorId) {
            console.log('Cliente ya tiene entrenador asignado:', cliente.entrenadorId);
            return res.status(400).json({ error: 'Ya tienes un entrenador asignado. No puedes cambiar de entrenador.' });
        }
        
        // Asignar directamente el entrenador al cliente para evitar problemas con el servicio
        cliente.entrenadorId = entrenadorId;
        cliente.fechaAsignacionEntrenador = new Date();
        
        const clienteActualizado = await cliente.save();
        console.log('Entrenador asignado correctamente:', { clienteId, entrenadorId });
        
        res.json({ mensaje: 'Entrenador seleccionado correctamente', cliente: clienteActualizado });
    } catch (error) {
        console.error('Error al seleccionar entrenador:', error);
        res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
};

