const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const Entrenador = require('../models/Entrenador');

// Middleware para verificar si el usuario está autenticado
exports.estaAutenticado = (req, res, next) => {
    if (req.session && req.session.usuario) {
        console.log('Usuario autenticado:', req.session.usuario._id);
        return next();
    }
    console.log('Usuario no autenticado, redirigiendo a login');
    res.redirect('/frontend/login?error=autenticacion_requerida');
};

// Middleware para verificar roles
exports.verificarRol = (roles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.usuario) {
            return res.redirect('/frontend/login?error=sesion_expirada');
        }

        const { tipoUsuario } = req.session.usuario;
        
        if (roles.includes(tipoUsuario)) {
            return next();
        }
        
        console.log(`Acceso denegado: Usuario ${req.session.usuario._id} con rol ${tipoUsuario} intentó acceder a una ruta restringida`);
        res.status(403).send('Acceso denegado: No tiene permisos para acceder a esta página');
    };
};

// Middleware para cargar datos del usuario en res.locals
exports.cargarDatosUsuario = async (req, res, next) => {
    try {
        if (!req.session || !req.session.usuario) {
            return next();
        }

        const usuarioId = req.session.usuario._id;
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            console.error('Usuario no encontrado en la base de datos:', usuarioId);
            return next();
        }

        // Cargar datos específicos según el tipo de usuario
        if (usuario.tipoUsuario === 'cliente') {
            const cliente = await Cliente.findOne({ usuarioId });
            if (cliente) {
                req.cliente = cliente;
                res.locals.cliente = cliente;
            }
        } else if (usuario.tipoUsuario === 'entrenador') {
            const entrenador = await Entrenador.findOne({ usuarioId });
            if (entrenador) {
                req.entrenador = entrenador;
                res.locals.entrenador = entrenador;
            }
        }

        // Agregar datos del usuario a res.locals para acceso en las vistas
        res.locals.usuario = {
            id: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            tipoUsuario: usuario.tipoUsuario,
            correo: usuario.correo
        };

        next();
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        next();
    }
};
