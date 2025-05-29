const Cliente = require('../models/Cliente');
const Usuario = require('../models/Usuario');

class ClienteService {
    async crearCliente(usuarioId, datosCliente) {
        try {
            console.log('Creando cliente para usuario:', usuarioId, 'con datos:', datosCliente);
            
            // Asegurar que los campos tengan valores predeterminados si no se proporcionan
            const datosCompletos = {
                objetivo: datosCliente.objetivo || 'No especificado',
                nivel: datosCliente.nivel || 'principiante',
                observaciones: datosCliente.observaciones || '',
                ...datosCliente
            };
            
            const nuevoCliente = await Cliente.create({ usuarioId, ...datosCompletos });
            console.log('Cliente creado con éxito:', nuevoCliente._id);
            return nuevoCliente;
        } catch (error) {
            console.error('Error al crear cliente:', error);
            throw error;
        }
    }

    async obtenerClientePorUsuario(usuarioId) {
        return await Cliente.findOne({ usuarioId }).populate('usuarioId');
    }

    async obtenerAllCliente() {
        return await Cliente.find().populate('usuarioId');
    }

    async actualizarCliente(usuarioId, datosActualizados){
        return await Cliente.findOneAndUpdate(
            { usuarioId },
            { $set: datosActualizados },
            { new: true, runValidators: true }
        );
    }
    
    async obtenerClientesPorEntrenador(entrenadorId) {
        try {
            console.log(`Buscando clientes para el entrenador con ID: ${entrenadorId}`);
            
            // Obtenemos los clientes que tienen este entrenador asignado
            const clientes = await Cliente.find({ entrenadorId })
                .populate({
                    path: 'usuarioId',
                    select: 'nombre apellido correo'
                });
            
            console.log(`Se encontraron ${clientes.length} clientes para el entrenador ${entrenadorId}`);
            
            return clientes.map(cliente => ({
                _id: cliente._id,
                usuarioId: cliente.usuarioId._id,
                nombre: cliente.usuarioId.nombre,
                apellido: cliente.usuarioId.apellido,
                correo: cliente.usuarioId.correo,
                objetivo: cliente.objetivo,
                nivel: cliente.nivel,
                observaciones: cliente.observaciones,
                fechaAsignacionEntrenador: cliente.fechaAsignacionEntrenador
            }));
        } catch (error) {
            console.error('Error al obtener clientes por entrenador:', error);
            throw error;
        }
    }
    
    async asignarEntrenadorACliente(clienteId, entrenadorId) {
        try {
            console.log(`Asignando entrenador ${entrenadorId} al cliente ${clienteId}`);
            
            const clienteActualizado = await Cliente.findByIdAndUpdate(
                clienteId,
                { 
                    entrenadorId: entrenadorId,
                    fechaAsignacionEntrenador: new Date()
                },
                { new: true }
            );
            
            if (!clienteActualizado) {
                throw new Error('Cliente no encontrado');
            }
            
            return clienteActualizado;
        } catch (error) {
            console.error('Error al asignar entrenador a cliente:', error);
            throw error;
        }
    }
}

module.exports = new ClienteService();
