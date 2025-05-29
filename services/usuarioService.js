const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const Entrenador = require('../models/Entrenador');
const CodigoVerificacion = require('../models/CodigoVerificacion');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UsuarioService {
    constructor() {}

    async crearUsuario(datosUsuario) {
        try {
            console.log('Datos recibidos para crear usuario:', JSON.stringify(datosUsuario, null, 2));
            
            // Validar campos obligatorios
            const camposObligatorios = ['nombre', 'apellido', 'correo', 'contrasenia', 'tipoUsuario'];
            for (const campo of camposObligatorios) {
                if (!datosUsuario[campo]) {
                    throw new Error(`El campo ${campo} es obligatorio`);
                }
            }

            // Verificar si ya existe un usuario con el mismo correo
            const usuarioExistente = await Usuario.findOne({ correo: datosUsuario.correo });
            if (usuarioExistente) {
                throw new Error('Ya existe un usuario con ese correo electrónico');
            }

            // Verificar código de verificación para entrenadores
            if (datosUsuario.tipoUsuario === 'entrenador') {
                console.log('Verificando código para entrenador:', datosUsuario.codigoVerificacion);
                
                if (!datosUsuario.codigoVerificacion) {
                    throw new Error('El código de verificación es obligatorio para registrarse como entrenador');
                }

                // Buscar el código de verificación en la base de datos
                const codigoVerificacion = await CodigoVerificacion.findOne({
                    codigo: datosUsuario.codigoVerificacion,
                    tipoUsuario: 'entrenador',
                    estado: 'activo'
                });

                console.log('Código de verificación encontrado:', codigoVerificacion ? 'Sí' : 'No');
                
                // Si no se encuentra el código o no está activo
                if (!codigoVerificacion) {
                    // Verificar si existe pero no está activo
                    const codigoInactivo = await CodigoVerificacion.findOne({
                        codigo: datosUsuario.codigoVerificacion,
                        tipoUsuario: 'entrenador'
                    });
                    
                    if (codigoInactivo) {
                        console.log('Código encontrado pero con estado:', codigoInactivo.estado);
                        if (codigoInactivo.estado === 'usado') {
                            throw new Error('Este código de verificación ya ha sido utilizado');
                        } else if (codigoInactivo.estado === 'expirado') {
                            throw new Error('Este código de verificación ha expirado');
                        }
                    }
                    
                    throw new Error('Código de verificación inválido');
                }

                // Verificar si el código ha expirado
                if (new Date() > new Date(codigoVerificacion.fechaExpiracion)) {
                    console.log('Código expirado, actualizando estado');
                    codigoVerificacion.estado = 'expirado';
                    await codigoVerificacion.save();
                    throw new Error('El código de verificación ha expirado');
                }
                
                console.log('Código de verificación válido');
            }
            
            // Encriptar contraseña
            datosUsuario.contrasenia = await bcrypt.hash(datosUsuario.contrasenia, 10);
            
            // Establecer estado inicial según tipo de usuario
            if (datosUsuario.tipoUsuario === 'entrenador') {
                datosUsuario.estado = 'pendiente'; // Los entrenadores requieren verificación adicional
            } else {
                datosUsuario.estado = 'activo'; // Los clientes se activan inmediatamente
            }
            
            // Crear y guardar el nuevo usuario
            const usuario = new Usuario(datosUsuario);
            const usuarioGuardado = await usuario.save();
            console.log('Usuario guardado correctamente en la base de datos:', usuarioGuardado._id);

            // Crear perfil de cliente si es necesario
            if (usuarioGuardado.tipoUsuario === 'cliente') {
                // Preparar datos del cliente con valores predeterminados si no se proporcionan
                const datosCliente = {
                    usuarioId: usuarioGuardado._id,
                    objetivo: datosUsuario.objetivo || 'No especificado',
                    nivel: datosUsuario.nivel || 'principiante',
                    observaciones: datosUsuario.observaciones || ''
                };
                
                try {
                    // Verificar si ya existe un perfil de cliente para este usuario
                    const clienteExistente = await Cliente.findOne({ usuarioId: usuarioGuardado._id });
                    
                    if (clienteExistente) {
                        console.log('Ya existe un perfil de cliente para este usuario:', clienteExistente._id);
                        // Actualizar el perfil existente
                        Object.assign(clienteExistente, datosCliente);
                        await clienteExistente.save();
                        console.log('Perfil de cliente actualizado exitosamente');
                    } else {
                        // Crear un nuevo perfil de cliente
                        const nuevoCliente = new Cliente(datosCliente);
                        const clienteCreado = await nuevoCliente.save();
                        console.log('Cliente creado exitosamente:', clienteCreado._id);
                    }
                } catch (error) {
                    console.error('Error al crear/actualizar el cliente:', error);
                    // Si hay un error al crear el cliente, eliminamos el usuario para mantener la integridad
                    await Usuario.findByIdAndDelete(usuarioGuardado._id);
                    throw new Error('Error al crear el perfil de cliente: ' + error.message);
                }
            }

            // Crear perfil de entrenador si es necesario
            if (usuarioGuardado.tipoUsuario === 'entrenador') {
                const datosEntrenador = {
                    usuarioId: usuarioGuardado._id,
                    especialidad: datosUsuario.especialidad || '',
                    certificaciones: datosUsuario.certificaciones ? datosUsuario.certificaciones.split(',').map(c => c.trim()) : [],
                    experienciaAnios: datosUsuario.experienciaAnios || 0,
                    descripcionPerfil: datosUsuario.descripcionPerfil || '',
                    codigoVerificacion: datosUsuario.codigoVerificacion,
                    estado: 'pendiente'
                };
                
                try {
                    const entrenadorCreado = await Entrenador.create(datosEntrenador);
                    console.log('Entrenador creado exitosamente:', entrenadorCreado._id);
                    
                    // Marcar el código como usado
                    if (datosUsuario.codigoVerificacion) {
                        const codigoVerificacion = await CodigoVerificacion.findOne({ 
                            codigo: datosUsuario.codigoVerificacion,
                            tipoUsuario: 'entrenador'
                        });
                        
                        if (codigoVerificacion) {
                            codigoVerificacion.estado = 'usado';
                            codigoVerificacion.usadoPor = usuarioGuardado._id;
                            codigoVerificacion.fechaUso = new Date();
                            await codigoVerificacion.save();
                            console.log('Código de verificación marcado como usado');
                        }
                    }
                } catch (error) {
                    console.error('Error al crear el entrenador:', error);
                    // Si hay un error al crear el entrenador, eliminamos el usuario para mantener la integridad
                    await Usuario.findByIdAndDelete(usuarioGuardado._id);
                    throw new Error('Error al crear el perfil de entrenador: ' + error.message);
                }
            }
            
            console.log('Usuario creado exitosamente:', usuarioGuardado);
            return usuarioGuardado;
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    async loginUsuario(correo, contrasenia) {
        const usuario = await Usuario.findOne({ correo });
        if (!usuario) throw new Error('Usuario no encontrado');

        const esValida = await bcrypt.compare(contrasenia, usuario.contrasenia);
        if (!esValida) throw new Error('Contraseña incorrecta');

        const token = jwt.sign({ id: usuario._id }, 'claveSecreta', { expiresIn: '1h' });
        return { mensaje: 'Login exitoso', token };
    }

    async obtenerUsuarios() {
        return await Usuario.find();
    }

    async actualizarUsuario(id, datosActualizados) {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new Error('Usuario no encontrado');

        return await Usuario.findByIdAndUpdate(id, datosActualizados, { new: true });
    }

    async eliminarUsuario(id) {
        const usuario = await Usuario.findById(id);
        if (!usuario) throw new Error('Usuario no encontrado');

        return await Usuario.findByIdAndUpdate(id, { estado: 'inactivo' }, { new: true });
    }

    async obtenerPerfil(id) {
        return await Usuario.findById(id);
    }
}

module.exports = new UsuarioService();
