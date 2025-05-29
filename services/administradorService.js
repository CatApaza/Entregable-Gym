const Administrador = require('../models/Administrador');
const Usuario = require('../models/Usuario');
const CodigoVerificacion = require('../models/CodigoVerificacion');
const Entrenador = require('../models/Entrenador');
const Cliente = require('../models/Cliente');
const crypto = require('crypto');

class AdministradorService {
    // Crear un nuevo administrador
    async crearAdministrador(data) {
        try {
            // Verificar si el usuario ya existe
            const usuarioExistente = await Usuario.findById(data.usuarioId);
            if (!usuarioExistente) {
                throw new Error('El usuario no existe');
            }

            // Verificar si ya existe un administrador con ese usuario
            const adminExistente = await Administrador.findOne({ usuarioId: data.usuarioId });
            if (adminExistente) {
                throw new Error('Este usuario ya es un administrador');
            }

            // Actualizar el tipo de usuario
            usuarioExistente.tipoUsuario = 'administrador';
            usuarioExistente.estado = 'activo';
            usuarioExistente.verificado = true;
            await usuarioExistente.save();

            // Crear el administrador
            const nuevoAdmin = await Administrador.create(data);
            return nuevoAdmin;
        } catch (error) {
            console.error('Error al crear administrador:', error);
            throw error;
        }
    }

    // Obtener todos los administradores
    async listarAdministradores() {
        try {
            return await Administrador.find().populate('usuarioId');
        } catch (error) {
            console.error('Error al listar administradores:', error);
            throw error;
        }
    }

    // Obtener un administrador por ID
    async obtenerAdministrador(id) {
        try {
            return await Administrador.findById(id).populate('usuarioId');
        } catch (error) {
            console.error('Error al obtener administrador:', error);
            throw error;
        }
    }

    // Obtener un administrador por ID de usuario
    async obtenerAdministradorPorUsuario(usuarioId) {
        try {
            return await Administrador.findOne({ usuarioId }).populate('usuarioId');
        } catch (error) {
            console.error('Error al obtener administrador por usuario:', error);
            throw error;
        }
    }

    // Actualizar un administrador
    async actualizarAdministrador(id, data) {
        try {
            return await Administrador.findByIdAndUpdate(id, data, { new: true });
        } catch (error) {
            console.error('Error al actualizar administrador:', error);
            throw error;
        }
    }

    // Generar código de verificación para entrenador
    async generarCodigoVerificacion(adminId, tipoUsuario = 'entrenador') {
        try {
            const admin = await Administrador.findById(adminId);
            if (!admin) {
                throw new Error('Administrador no encontrado');
            }

            // Generar un código aleatorio
            const codigo = crypto.randomBytes(4).toString('hex').toUpperCase();
            
            // Fecha de expiración (30 días)
            const fechaExpiracion = new Date();
            fechaExpiracion.setDate(fechaExpiracion.getDate() + 30);

            // Crear el código de verificación
            const nuevoCodigoVerificacion = await CodigoVerificacion.create({
                codigo,
                tipoUsuario,
                fechaExpiracion,
                creadoPor: admin.usuarioId
            });

            // Guardar referencia en el administrador
            admin.codigosGenerados.push({
                codigo,
                tipo: tipoUsuario,
                fechaCreacion: new Date(),
                fechaExpiracion
            });
            await admin.save();

            return nuevoCodigoVerificacion;
        } catch (error) {
            console.error('Error al generar código de verificación:', error);
            throw error;
        }
    }

    // Verificar un entrenador
    async verificarEntrenador(entrenadorId, adminId) {
        try {
            const entrenador = await Entrenador.findById(entrenadorId);
            if (!entrenador) {
                throw new Error('Entrenador no encontrado');
            }

            const admin = await Administrador.findById(adminId);
            if (!admin) {
                throw new Error('Administrador no encontrado');
            }

            // Actualizar el entrenador
            entrenador.verificado = true;
            entrenador.fechaVerificacion = new Date();
            entrenador.verificadoPor = admin.usuarioId;
            entrenador.estado = 'activo';
            await entrenador.save();

            // Actualizar el usuario asociado
            const usuario = await Usuario.findById(entrenador.usuarioId);
            if (usuario) {
                usuario.verificado = true;
                usuario.estado = 'activo';
                await usuario.save();
            }

            return entrenador;
        } catch (error) {
            console.error('Error al verificar entrenador:', error);
            throw error;
        }
    }

    // Cambiar estado de un usuario (activar/desactivar)
    async cambiarEstadoUsuario(usuarioId, nuevoEstado) {
        try {
            const usuario = await Usuario.findById(usuarioId);
            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }

            usuario.estado = nuevoEstado;
            await usuario.save();

            // Si es entrenador o cliente, actualizar su estado también
            if (usuario.tipoUsuario === 'entrenador') {
                const entrenador = await Entrenador.findOne({ usuarioId });
                if (entrenador) {
                    entrenador.estado = nuevoEstado === 'activo' ? 'activo' : 'inactivo';
                    await entrenador.save();
                }
            } else if (usuario.tipoUsuario === 'cliente') {
                // Aquí podrías actualizar el estado del cliente si tienes un campo similar
                // Por ahora, solo actualizamos el usuario
            }

            return usuario;
        } catch (error) {
            console.error('Error al cambiar estado de usuario:', error);
            throw error;
        }
    }

    // Listar todos los entrenadores con su estado de verificación
    async listarEntrenadores() {
        try {
            const entrenadores = await Entrenador.find().populate('usuarioId');
            return entrenadores;
        } catch (error) {
            console.error('Error al listar entrenadores:', error);
            throw error;
        }
    }

    // Listar todos los clientes
    async listarClientes() {
        try {
            const clientes = await Cliente.find().populate('usuarioId');
            return clientes;
        } catch (error) {
            console.error('Error al listar clientes:', error);
            throw error;
        }
    }

    // Validar código de verificación
    async validarCodigoVerificacion(codigo, tipoUsuario) {
        try {
            const codigoVerificacion = await CodigoVerificacion.findOne({ 
                codigo, 
                tipoUsuario,
                estado: 'activo'
            });

            if (!codigoVerificacion) {
                throw new Error('Código de verificación inválido o ya utilizado');
            }

            if (codigoVerificacion.haExpirado()) {
                codigoVerificacion.estado = 'expirado';
                await codigoVerificacion.save();
                throw new Error('El código de verificación ha expirado');
            }

            return codigoVerificacion;
        } catch (error) {
            console.error('Error al validar código de verificación:', error);
            throw error;
        }
    }
}

module.exports = new AdministradorService();
