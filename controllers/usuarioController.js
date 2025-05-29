const usuarioService = require('../services/usuarioService');
const clienteService = require('../services/clienteService');
const { verificarCliente } = require('../middlewares/verificarClienteMiddleware');
const { verificarEntrenador } = require('../middlewares/verificarEntrenadorMiddleware');

// Crear un nuevo usuario
exports.crearUsuario = async (req, res) => {
    try {
        console.log('Datos recibidos para crear usuario:', req.body);
        
        // Validación básica
        if (!req.body.tipoUsuario || !['cliente', 'entrenador'].includes(req.body.tipoUsuario)) {
            return res.status(400).json({ error: 'Tipo de usuario inválido o no especificado' });
        }

        // Validación específica para entrenadores
        if (req.body.tipoUsuario === 'entrenador' && !req.body.codigoVerificacion) {
            return res.status(400).json({ 
                error: 'Código de verificación requerido', 
                mensaje: 'Para registrarse como entrenador, debe proporcionar un código de verificación válido'
            });
        }

        // Validar campos obligatorios
        const camposObligatorios = ['nombre', 'apellido', 'correo', 'contrasenia'];
        for (const campo of camposObligatorios) {
            if (!req.body[campo]) {
                return res.status(400).json({ 
                    error: 'Campos incompletos', 
                    mensaje: `El campo ${campo} es obligatorio`
                });
            }
        }

        // Crear usuario con los datos proporcionados
        const usuario = await usuarioService.crearUsuario(req.body);
        console.log('Usuario creado correctamente:', usuario._id);

        // Eliminar información sensible antes de responder
        const usuarioRespuesta = usuario.toObject();
        delete usuarioRespuesta.contrasenia;

        // Preparar mensaje de respuesta según el tipo de usuario
        let mensaje = 'Usuario creado exitosamente';
        if (usuario.tipoUsuario === 'entrenador') {
            mensaje = 'Su registro como entrenador ha sido recibido. Un administrador revisará su solicitud para completar la verificación.';
        } else if (usuario.tipoUsuario === 'cliente') {
            mensaje = 'Bienvenido a GimnasioApp. Su cuenta ha sido activada correctamente.';
        }

        res.status(201).json({
            usuario: usuarioRespuesta,
            mensaje: mensaje
        });
    } catch (err) {
        console.error('Error al crear usuario:', err);
        
        // Manejar errores específicos
        if (err.message.includes('código de verificación')) {
            return res.status(400).json({ 
                error: 'Error de verificación', 
                mensaje: err.message 
            });
        } else if (err.message.includes('duplicate key error')) {
            return res.status(400).json({ 
                error: 'Usuario ya existe', 
                mensaje: 'Ya existe un usuario con ese correo electrónico'
            });
        } else if (err.message.includes('Error al crear el perfil de cliente')) {
            return res.status(500).json({ 
                error: 'Error en registro de cliente', 
                mensaje: err.message 
            });
        }
        
        res.status(500).json({ 
            error: 'Error en el servidor', 
            mensaje: err.message 
        });
    }
};

// Obtener el perfil del usuario actual
exports.obtenerPerfil = async (req, res) => {
    try {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const usuarioId = req.session.usuario._id;
        console.log('Obteniendo perfil para usuario:', usuarioId);

        // Obtener datos del usuario
        const usuario = await usuarioService.obtenerPerfil(usuarioId);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Eliminar información sensible
        const usuarioRespuesta = usuario.toObject();
        delete usuarioRespuesta.contrasenia;

        // Obtener datos específicos según el tipo de usuario
        let perfilEspecifico = null;
        if (usuario.tipoUsuario === 'cliente') {
            perfilEspecifico = await clienteService.obtenerClientePorUsuario(usuarioId);
        } else if (usuario.tipoUsuario === 'entrenador') {
            // Aquí iría la lógica para obtener datos del entrenador
            // perfilEspecifico = await entrenadorService.obtenerEntrenadorPorUsuario(usuarioId);
        }

        res.json({
            usuario: usuarioRespuesta,
            perfilEspecifico: perfilEspecifico
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar el perfil del usuario actual
exports.actualizarPerfil = async (req, res) => {
    try {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        const usuarioId = req.session.usuario._id;
        console.log('Actualizando perfil para usuario:', usuarioId, 'con datos:', req.body);

        // Verificar que el usuario existe
        const usuarioExistente = await usuarioService.obtenerPerfil(usuarioId);
        if (!usuarioExistente) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Datos que se pueden actualizar del usuario
        const datosUsuario = {};
        const camposPermitidos = ['nombre', 'apellido', 'telefono', 'genero'];
        
        for (const campo of camposPermitidos) {
            if (req.body[campo] !== undefined) {
                datosUsuario[campo] = req.body[campo];
            }
        }

        // Actualizar datos del usuario
        if (Object.keys(datosUsuario).length > 0) {
            await usuarioService.actualizarUsuario(usuarioId, datosUsuario);
        }

        // Actualizar datos específicos según el tipo de usuario
        if (usuarioExistente.tipoUsuario === 'cliente' && req.body.datosCliente) {
            await clienteService.actualizarCliente(usuarioId, req.body.datosCliente);
        } else if (usuarioExistente.tipoUsuario === 'entrenador' && req.body.datosEntrenador) {
            // Aquí iría la lógica para actualizar datos del entrenador
            // await entrenadorService.actualizarEntrenador(usuarioId, req.body.datosEntrenador);
        }

        res.json({ mensaje: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};