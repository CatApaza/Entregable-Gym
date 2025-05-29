const administradorService = require('../services/administradorService');
const Usuario = require('../models/Usuario');
const Entrenador = require('../models/Entrenador');
const Cliente = require('../models/Cliente');
const CodigoVerificacion = require('../models/CodigoVerificacion');
const Rutina = require('../models/Rutina');

class AdministradorController {
    // Mostrar panel de administración
    async mostrarPanelAdmin(req, res) {
        try {
            // Verificar si el usuario es administrador
            const usuarioId = req.session?.usuario?._id;
            if (!usuarioId) {
                return res.redirect('/frontend/login?error=Debe iniciar sesión');
            }

            const usuario = await Usuario.findById(usuarioId);
            if (!usuario || usuario.tipoUsuario !== 'administrador') {
                return res.redirect('/frontend/login?error=Acceso no autorizado');
            }

            // Obtener datos para el panel
            const admin = await administradorService.obtenerAdministradorPorUsuario(usuarioId);
            
            // Obtener entrenadores con todos sus datos
            const entrenadores = await Entrenador.find()
                .populate({
                    path: 'usuarioId',
                    select: 'nombre apellido correo telefono estado verificado'
                });
            
            // Obtener clientes con todos sus datos
            const clientes = await Cliente.find()
                .populate({
                    path: 'usuarioId',
                    select: 'nombre apellido correo telefono estado verificado'
                });
            
            // Obtener el número total de rutinas
            const totalRutinas = await Rutina.countDocuments();
            
            // Obtener el número total de usuarios
            const totalUsuarios = await Usuario.countDocuments();

            // Obtener todas las rutinas para la pestaña de rutinas
            const rutinas = await Rutina.find()
                .populate({
                    path: 'clienteId',
                    populate: {
                        path: 'usuarioId',
                        select: 'nombre apellido'
                    }
                })
                .populate({
                    path: 'entrenadorId',
                    populate: {
                        path: 'usuarioId',
                        select: 'nombre apellido'
                    }
                });

            // Obtener códigos de verificación generados por este administrador
            const codigosVerificacion = await CodigoVerificacion.find()
                .sort({ fechaCreacion: -1 })
                .limit(10);

            // Calcular totales para el dashboard
            const totalEntrenadores = entrenadores.length;
            const totalClientes = clientes.length;
            
            // Crear un array vacío para actividades recientes (se implementará en el futuro)
            const actividades = [];
            
            // Renderizar vista de administración
            return res.render('adminDashboard', {
                admin,
                usuario,
                entrenadores,
                clientes,
                rutinas,
                codigosVerificacion,
                totalRutinas,
                totalUsuarios,
                totalEntrenadores,
                totalClientes,
                actividades,
                mensaje: req.query.mensaje,
                error: req.query.error
            });
        } catch (error) {
            console.error('Error al mostrar panel de administración:', error);
            return res.redirect(`/frontend/login?error=${encodeURIComponent('Error al cargar panel de administración')}`);
        }
    }

    // Generar código de verificación
    async generarCodigoVerificacion(req, res) {
        try {
            const { adminId, tipoUsuario } = req.body;

            if (!adminId) {
                return res.status(400).json({ error: 'ID de administrador requerido' });
            }

            const codigoVerificacion = await administradorService.generarCodigoVerificacion(adminId, tipoUsuario || 'entrenador');

            // Si es una solicitud AJAX, devolver JSON
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.status(201).json(codigoVerificacion);
            }

            // Si no, redirigir al panel con mensaje
            return res.redirect(`/admin/dashboard?mensaje=Código generado: ${codigoVerificacion.codigo}`);
        } catch (error) {
            console.error('Error al generar código de verificación:', error);

            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.status(500).json({ error: error.message });
            }

            return res.redirect(`/admin/dashboard?error=${encodeURIComponent(error.message)}`);
        }
    }

    // Verificar entrenador
    async verificarEntrenador(req, res) {
        try {
            const { entrenadorId, adminId } = req.body;

            if (!entrenadorId || !adminId) {
                return res.status(400).json({ error: 'IDs de entrenador y administrador requeridos' });
            }

            const entrenador = await administradorService.verificarEntrenador(entrenadorId, adminId);

            // Si es una solicitud AJAX, devolver JSON
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.json(entrenador);
            }

            // Si no, redirigir al panel con mensaje
            return res.redirect(`/admin/dashboard?mensaje=Entrenador verificado correctamente`);
        } catch (error) {
            console.error('Error al verificar entrenador:', error);

            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.status(500).json({ error: error.message });
            }

            return res.redirect(`/admin/dashboard?error=${encodeURIComponent(error.message)}`);
        }
    }

    // Cambiar estado de usuario
    async cambiarEstadoUsuario(req, res) {
        try {
            const { usuarioId, estado } = req.body;

            if (!usuarioId || !estado) {
                return res.status(400).json({ error: 'ID de usuario y estado requeridos' });
            }

            const usuario = await administradorService.cambiarEstadoUsuario(usuarioId, estado);

            // Si es una solicitud AJAX, devolver JSON
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.json(usuario);
            }

            // Si no, redirigir al panel con mensaje
            return res.redirect(`/admin/dashboard?mensaje=Estado de usuario actualizado correctamente`);
        } catch (error) {
            console.error('Error al cambiar estado de usuario:', error);

            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.status(500).json({ error: error.message });
            }

            return res.redirect(`/admin/dashboard?error=${encodeURIComponent(error.message)}`);
        }
    }

    // Listar entrenadores
    async listarEntrenadores(req, res) {
        try {
            const entrenadores = await administradorService.listarEntrenadores();

            // Si es una solicitud AJAX, devolver JSON
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.json(entrenadores);
            }

            // Si no, renderizar vista
            return res.render('adminEntrenadores', { entrenadores });
        } catch (error) {
            console.error('Error al listar entrenadores:', error);

            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.status(500).json({ error: error.message });
            }

            return res.redirect(`/admin/dashboard?error=${encodeURIComponent(error.message)}`);
        }
    }

    // Listar clientes
    async listarClientes(req, res) {
        try {
            const clientes = await administradorService.listarClientes();

            // Si es una solicitud AJAX, devolver JSON
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.json(clientes);
            }

            // Si no, renderizar vista
            return res.render('adminClientes', { clientes });
        } catch (error) {
            console.error('Error al listar clientes:', error);

            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.status(500).json({ error: error.message });
            }

            return res.redirect(`/admin/dashboard?error=${encodeURIComponent(error.message)}`);
        }
    }

    // Validar código de verificación
    async validarCodigoVerificacion(req, res) {
        try {
            const { codigo, tipoUsuario } = req.body;

            if (!codigo || !tipoUsuario) {
                return res.status(400).json({ error: 'Código y tipo de usuario requeridos' });
            }

            const codigoVerificacion = await administradorService.validarCodigoVerificacion(codigo, tipoUsuario);

            // Si es una solicitud AJAX, devolver JSON
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.json({ valido: true, codigo: codigoVerificacion });
            }

            // Si no, redirigir con mensaje
            return res.redirect(`/frontend/registro?mensaje=Código válido&codigo=${codigo}`);
        } catch (error) {
            console.error('Error al validar código de verificación:', error);

            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.status(400).json({ valido: false, error: error.message });
            }

            return res.redirect(`/frontend/registro?error=${encodeURIComponent(error.message)}`);
        }
    }

    // Listar códigos de verificación
    async listarCodigosVerificacion(req, res) {
        try {
            const { adminId, estado } = req.query;
            let filtro = {};
            
            if (adminId) {
                filtro.generadoPor = adminId;
            }
            
            if (estado && ['activo', 'usado', 'expirado'].includes(estado)) {
                filtro.estado = estado;
            }
            
            const codigosVerificacion = await CodigoVerificacion.find(filtro)
                .sort({ fechaCreacion: -1 })
                .populate('generadoPor', 'nombre')
                .populate('usadoPor', 'nombre correo');

            // Si es una solicitud AJAX, devolver JSON
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.json(codigosVerificacion);
            }
            
            // Si no, renderizar vista
            return res.render('adminCodigos', { codigosVerificacion });
        } catch (error) {
            console.error('Error al listar códigos de verificación:', error);

            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.status(500).json({ error: error.message });
            }

            return res.redirect(`/admin/dashboard?error=${encodeURIComponent(error.message)}`);
        }
    }
}

module.exports = new AdministradorController();
