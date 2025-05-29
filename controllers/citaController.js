const citaService = require('../services/citaService');
const Entrenador = require('../models/Entrenador');
const Cliente = require('../models/Cliente');

class CitaController {
    // Mostrar formulario para crear una nueva cita (vista del cliente)
    async mostrarFormularioCrearCita(req, res) {
        try {
            // Obtener el ID del cliente desde la sesión o parámetro
            const clienteId = req.params.clienteId || req.session.usuario.clienteId;
            
            // Buscar el cliente para obtener su entrenador asignado
            const cliente = await Cliente.findById(clienteId);
            if (!cliente) {
                return res.status(404).send('Cliente no encontrado');
            }

            // Si el cliente no tiene entrenador asignado, mostrar mensaje
            if (!cliente.entrenadorId) {
                return res.render('seleccionarEntrenador', {
                    mensaje: 'Primero debes seleccionar un entrenador para poder agendar citas.',
                    clienteId
                });
            }

            // Obtener información del entrenador
            const entrenador = await Entrenador.findById(cliente.entrenadorId).populate('usuarioId');
            if (!entrenador) {
                return res.status(404).send('Entrenador no encontrado');
            }

            // Renderizar formulario de creación de cita
            res.render('crearCita', {
                cliente,
                entrenador: {
                    id: entrenador._id,
                    nombre: entrenador.usuarioId.nombre,
                    apellido: entrenador.usuarioId.apellido
                },
                clienteId,
                entrenadorId: entrenador._id
            });
        } catch (error) {
            console.error('Error al mostrar formulario de creación de cita:', error);
            res.status(500).send('Error al cargar el formulario: ' + error.message);
        }
    }

    // Crear una nueva cita
    async crearCita(req, res) {
        try {
            const { clienteId, entrenadorId, fecha, horaInicio, horaFin, tipoCita, notas } = req.body;
            
            // Validar datos requeridos
            if (!clienteId || !entrenadorId || !fecha || !horaInicio || !horaFin) {
                return res.status(400).json({ error: 'Faltan datos requeridos para la cita' });
            }

            // Verificar disponibilidad del entrenador
            const disponible = await citaService.verificarDisponibilidad(
                entrenadorId, fecha, horaInicio, horaFin
            );

            if (!disponible) {
                return res.status(409).json({ error: 'El entrenador no está disponible en ese horario' });
            }

            // Crear la cita
            const nuevaCita = await citaService.crearCita({
                clienteId,
                entrenadorId,
                fecha,
                horaInicio,
                horaFin,
                tipoCita,
                notas,
                estado: 'Pendiente'
            });

            // Si es una solicitud AJAX, devolver JSON
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(201).json({
                    success: true,
                    cita: nuevaCita,
                    mensaje: 'Cita creada correctamente'
                });
            }

            // Redirigir a la vista de citas del cliente
            return res.redirect(`/citas/cliente/${clienteId}?mensaje=Cita creada correctamente`);
        } catch (error) {
            console.error('Error al crear cita:', error);
            
            // Si es una solicitud AJAX, devolver error en formato JSON
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(500).json({ error: error.message });
            }
            
            // Redirigir con mensaje de error
            return res.redirect(`/citas/cliente/${req.body.clienteId}?error=${encodeURIComponent('Error al crear cita: ' + error.message)}`);
        }
    }

    // Listar citas de un cliente
    async listarCitasCliente(req, res) {
        try {
            const clienteId = req.params.clienteId;
            
            // Verificar que el cliente exista
            const cliente = await Cliente.findById(clienteId).populate('usuarioId');
            if (!cliente) {
                return res.status(404).json({ success: false, mensaje: 'Cliente no encontrado' });
            }
            
            // Obtener todas las citas del cliente usando el servicio
            const citas = await citaService.obtenerCitasPorCliente(clienteId);
            
            res.render('citasCliente', {
                cliente,
                citas,
                usuario: {
                    tipo: 'cliente',
                    id: clienteId
                },
                mensaje: req.query.mensaje,
                error: req.query.error
            });
        } catch (error) {
            console.error('Error al listar citas del cliente:', error);
            res.status(500).json({ success: false, mensaje: 'Error al listar citas' });
        }
    }

    // Listar citas de un entrenador
    async listarCitasEntrenador(req, res) {
        try {
            const entrenadorId = req.params.entrenadorId;
            
            // Verificar que el entrenador exista
            const entrenador = await Entrenador.findById(entrenadorId).populate('usuarioId');
            if (!entrenador) {
                return res.status(404).json({ success: false, mensaje: 'Entrenador no encontrado' });
            }
            
            // Obtener todas las citas del entrenador usando el servicio
            const citas = await citaService.obtenerCitasPorEntrenador(entrenadorId);
            
            res.render('citasEntrenador', {
                entrenador,
                citas,
                usuario: {
                    tipo: 'entrenador',
                    id: entrenadorId
                },
                mensaje: req.query.mensaje,
                error: req.query.error
            });
        } catch (error) {
            console.error('Error al listar citas del entrenador:', error);
            res.status(500).json({ success: false, mensaje: 'Error al listar citas' });
        }
    }

    // Ver detalles de una cita
    async verDetalleCita(req, res) {
        try {
            const citaId = req.params.id;
            
            // Obtener la cita con sus relaciones
            const cita = await Cita.findById(citaId)
                .populate({
                    path: 'clienteId',
                    populate: {
                        path: 'usuarioId',
                        select: 'nombre apellido email telefono'
                    }
                })
                .populate({
                    path: 'entrenadorId',
                    populate: {
                        path: 'usuarioId',
                        select: 'nombre apellido email telefono'
                    }
                });
            
            if (!cita) {
                return res.status(404).json({ success: false, mensaje: 'Cita no encontrada' });
            }
            
            // Determinar el tipo de usuario que está viendo la cita
            let tipoUsuario = 'cliente';
            let idUsuario = cita.clienteId._id;
            
            // Verificar si hay un usuario en la sesión
            if (req.session && req.session.usuario) {
                if (req.session.usuario.tipoUsuario === 'entrenador') {
                    tipoUsuario = 'entrenador';
                    idUsuario = cita.entrenadorId._id;
                }
            }
            
            res.render('detalleCita', {
                cita,
                usuario: {
                    tipo: tipoUsuario,
                    id: idUsuario
                },
                mensaje: req.query.mensaje,
                error: req.query.error
            });
        } catch (error) {
            console.error('Error al ver detalle de cita:', error);
            res.status(500).json({ success: false, mensaje: 'Error al cargar detalle de cita' });
        }
    }

    // Cambiar estado de una cita
    async cambiarEstadoCita(req, res) {
        try {
            const citaId = req.params.id;
            const { estado } = req.body;
            
            // Validar estado
            const estadosValidos = ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({ error: 'Estado no válido' });
            }
            
            // Actualizar estado de la cita
            const citaActualizada = await citaService.cambiarEstadoCita(citaId, estado);
            if (!citaActualizada) {
                return res.status(404).json({ error: 'Cita no encontrada' });
            }
            
            // Si es una solicitud AJAX, devolver JSON
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.json({
                    success: true,
                    cita: citaActualizada,
                    mensaje: `Estado de la cita actualizado a: ${estado}`
                });
            }
            
            // Redirigir a la página de detalles de la cita
            return res.redirect(`/api/citas/${citaId}?mensaje=Estado actualizado a: ${estado}`);
        } catch (error) {
            console.error('Error al cambiar estado de la cita:', error);
            
            // Si es una solicitud AJAX, devolver error en formato JSON
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(500).json({ error: error.message });
            }
            
            // Redirigir con mensaje de error
            return res.redirect(`/api/citas/${req.params.id}?error=${encodeURIComponent('Error al actualizar estado: ' + error.message)}`);
        }
    }

    // Eliminar una cita
    async eliminarCita(req, res) {
        try {
            const citaId = req.params.id;
            
            // Obtener la cita antes de eliminarla para usar sus datos en la redirección
            const cita = await citaService.obtenerCitaPorId(citaId);
            if (!cita) {
                return res.status(404).json({ error: 'Cita no encontrada' });
            }
            
            // Guardar IDs antes de eliminar
            const clienteId = cita.clienteId._id;
            const entrenadorId = cita.entrenadorId._id;
            
            // Eliminar la cita
            await citaService.eliminarCita(citaId);
            
            // Si es una solicitud AJAX, devolver JSON
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.json({
                    success: true,
                    mensaje: 'Cita eliminada correctamente'
                });
            }
            
            // Redirigir según el tipo de usuario
            if (req.session.usuario.tipoUsuario === 'cliente') {
                return res.redirect(`/clientes/${clienteId}/citas?mensaje=Cita eliminada correctamente`);
            } else {
                return res.redirect(`/entrenadores/${entrenadorId}/citas?mensaje=Cita eliminada correctamente`);
            }
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            
            // Si es una solicitud AJAX, devolver error en formato JSON
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(500).json({ error: error.message });
            }
            
            // Redirigir con mensaje de error
            return res.redirect(`/citas/${req.params.id}?error=${encodeURIComponent('Error al eliminar cita: ' + error.message)}`);
        }
    }

    // Verificar disponibilidad del entrenador
    async verificarDisponibilidad(req, res) {
        try {
            const { entrenadorId, fecha, horaInicio, horaFin, citaId } = req.query;
            
            console.log('Parámetros recibidos para verificar disponibilidad:');
            console.log('entrenadorId:', entrenadorId);
            console.log('fecha:', fecha);
            console.log('horaInicio:', horaInicio);
            console.log('horaFin:', horaFin);
            console.log('citaId:', citaId || 'No proporcionado');
            
            // Validar datos requeridos
            if (!entrenadorId || !fecha || !horaInicio || !horaFin) {
                console.log('ERROR: Faltan datos requeridos');
                return res.status(400).json({ 
                    disponible: false,
                    error: 'Faltan datos requeridos para verificar disponibilidad' 
                });
            }
            
            // Verificar disponibilidad
            console.log('Llamando al servicio para verificar disponibilidad...');
            const disponible = await citaService.verificarDisponibilidad(
                entrenadorId, fecha, horaInicio, horaFin, citaId
            );
            
            console.log('Resultado de verificación:', disponible ? 'DISPONIBLE' : 'NO DISPONIBLE');
            
            // Devolver resultado
            res.json({
                disponible,
                mensaje: disponible ? 'Horario disponible' : 'El entrenador no está disponible en ese horario'
            });
        } catch (error) {
            console.error('Error al verificar disponibilidad:', error);
            res.status(500).json({ 
                disponible: false,
                error: error.message 
            });
        }
    }
}

module.exports = new CitaController();
