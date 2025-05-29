const Entrenador = require('../models/Entrenador');

exports.verificarEntrenador = async (req, res, next) => {
    try {
        // Verificar si hay un usuario en la sesión
        if (!req.session || !req.session.usuario) {
            console.log('No hay sesión de usuario activa');
            return res.redirect('/frontend/login?error=sesion_requerida');
        }

        // Obtener el ID del usuario de la sesión
        const usuarioId = req.session.usuario._id;
        console.log('Verificando entrenador para usuario:', usuarioId);

        // Buscar el entrenador asociado al usuario
        const entrenadorExistente = await Entrenador.findOne({ usuarioId });
        
        if (!entrenadorExistente) {
            console.error('No se encontró el perfil de entrenador para el usuario:', usuarioId);
            return res.redirect('/frontend/login?error=perfil_no_encontrado');
        }

        // Verificar el estado del entrenador
        if (entrenadorExistente.estado !== 'activo') {
            console.log('Entrenador no activo:', entrenadorExistente.estado);
            return res.redirect('/frontend/login?error=entrenador_no_activo');
        }

        // Agregar el entrenador a la solicitud para uso posterior
        req.entrenador = entrenadorExistente;
        req.user = { id: usuarioId, tipoUsuario: 'entrenador' };
        
        console.log('Entrenador verificado correctamente:', entrenadorExistente._id);
        next();
    } catch (error) {
        console.error('Error al verificar entrenador:', error);
        res.status(500).send('Error del servidor al verificar el perfil de entrenador');
    }
};
