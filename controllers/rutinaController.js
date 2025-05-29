const rutinaService = require('../services/rutinaService');
const Entrenador = require('../models/Entrenador');
const Rutina = require('../models/Rutina');

class RutinaController {
    async obtenerRutinasPorCliente(req, res) {
        try {
            const clienteId = req.params.clienteId;
            console.log('Obteniendo rutinas para el cliente:', clienteId);
            
            const rutinas = await rutinaService.obtenerRutinasPorCliente(clienteId);
            console.log(`Se encontraron ${rutinas.length} rutinas para el cliente ${clienteId}`);
            
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.json(rutinas);
            }
            
            // Renderizar la vista de rutinas del cliente
            return res.render('rutinasCliente', {
                rutinas: rutinas,
                clienteId: clienteId,
                ...res.locals // Mantener cualquier otra variable local
            });
        } catch (error) {
            console.error('Error al obtener rutinas del cliente:', error);
            
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.status(500).json({ error: error.message });
            }
            
            return res.status(500).send('Error al obtener rutinas del cliente: ' + error.message);
        }
    }
    
    async listarRutinasDisponiblesParaAsignar(req, res) {
        try {
            const entrenadorId = req.params.entrenadorId;
            console.log('Listando rutinas disponibles para asignar del entrenador:', entrenadorId);
            
            const rutinas = await rutinaService.listarRutinasDisponiblesParaAsignar(entrenadorId);
            console.log(`Se encontraron ${rutinas.length} rutinas disponibles para asignar`);
            
            return res.json(rutinas);
        } catch (error) {
            console.error('Error al listar rutinas disponibles:', error);
            return res.status(500).json({ error: error.message });
        }
    }
    
    async crearRutina(req, res) {
        try {
            // Obtener el ID del entrenador desde el cuerpo de la solicitud
            const entrenadorId = req.body.entrenadorId;
            
            console.log('Datos recibidos para crear rutina:', req.body);
            console.log('ID del entrenador:', entrenadorId);
            console.log('Headers de solicitud:', req.headers);
            
            if (!entrenadorId) {
                console.error('Error: No se proporcionó ID de entrenador');
                return res.status(400).json({ error: 'No se proporcionó ID de entrenador' });
            }
            
            // Si se va a asignar a un cliente directamente, incluir clienteId en la creación
            const datosRutina = { ...req.body };
            if (req.body.asignarCliente && req.body.clienteId) {
                datosRutina.clienteId = req.body.clienteId;
                console.log('Asignando rutina directamente al cliente:', datosRutina.clienteId);
            }
            
            // Crear la rutina con los datos actualizados
            const nuevaRutina = await rutinaService.crearRutina(datosRutina);
            console.log('Rutina creada:', nuevaRutina);
            
            // Obtener la rutina completa con todas sus propiedades
            const rutinaCompleta = await rutinaService.obtenerRutinaPorId(nuevaRutina._id);
            console.log('Rutina completa obtenida:', rutinaCompleta._id);
            
            // Preparar el objeto de respuesta (necesario para evitar errores de JSON)
            let respuestaData;
            
            // Comprobar si rutinaCompleta es un documento mongoose
            if (rutinaCompleta && typeof rutinaCompleta.toObject === 'function') {
                respuestaData = rutinaCompleta.toObject();
            } else {
                // Si no es un documento mongoose, usar el objeto directamente
                respuestaData = { ...nuevaRutina.toObject ? nuevaRutina.toObject() : nuevaRutina };
            }
            
            // Si ya asignamos el cliente durante la creación, actualizar mensaje
            if (datosRutina.clienteId) {
                respuestaData.clienteId = datosRutina.clienteId;
                respuestaData.mensaje = 'Rutina creada y asignada correctamente';
            }
            
            // Verificar si la solicitud acepta JSON
            const aceptaJson = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));
            
            if (aceptaJson) {
                console.log('Enviando respuesta JSON:', respuestaData);
                // Asegurar el Content-Type para evitar errores de parseo
                res.setHeader('Content-Type', 'application/json');
                return res.status(201).json(respuestaData);
            }
            
            // Si no acepta JSON, redirigir a la página de asignación
            return res.redirect(`/rutinas/asignar/${rutinaCompleta._id}?mensaje=Rutina creada correctamente. Ahora puedes asignarla a un cliente.`);
        } catch (error) {
            console.error('Error al crear rutina:', error);
            if (req.xhr || req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.status(500).json({ error: error.message });
            }
            return res.redirect(`/entrenador/dashboard?error=${encodeURIComponent('Error al crear rutina: ' + error.message)}`);
        }
    }

    async asignarRutina(req, res) {
        try {
            console.log('Cuerpo de la solicitud para asignar rutina:', req.body);
            const { rutinaId, clienteId } = req.body;
            
            if (!rutinaId || !clienteId) {
                console.error('Faltan datos requeridos:', { rutinaId, clienteId });
                return res.status(400).json({ error: 'Faltan datos requeridos: rutinaId y clienteId son obligatorios' });
            }
            
            console.log('Asignando rutina:', rutinaId, 'a cliente:', clienteId);
            
            // Verificar que el cliente pertenezca al entrenador que está asignando la rutina
            const Entrenador = require('../models/Entrenador');
            const Cliente = require('../models/Cliente');
            
            // Obtener la rutina para verificar el entrenador
            const rutina = await Rutina.findById(rutinaId);
            if (!rutina) {
                console.error('Rutina no encontrada con ID:', rutinaId);
                return res.status(404).json({ error: 'Rutina no encontrada' });
            }
            
            console.log('Rutina encontrada:', rutina);
            
            // Obtener el cliente para verificar que pertenezca al entrenador
            const cliente = await Cliente.findById(clienteId).populate('usuarioId', 'nombre apellido');
            if (!cliente) {
                console.error('Cliente no encontrado con ID:', clienteId);
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            
            console.log('Cliente encontrado:', cliente._id, cliente.usuarioId.nombre);
            
            // Verificar que el cliente esté asignado al entrenador que creó la rutina
            if (cliente.entrenadorId && cliente.entrenadorId.toString() !== rutina.entrenadorId.toString()) {
                console.error('Verificación de entrenador fallida:', {
                    entrenadorCliente: cliente.entrenadorId.toString(),
                    entrenadorRutina: rutina.entrenadorId.toString()
                });
                return res.status(403).json({ 
                    error: 'No puedes asignar rutinas a clientes que no están asignados a ti' 
                });
            }
            
            try {
                // Método 1: Actualizar directamente con findByIdAndUpdate
                const rutinaActualizadaDirecta = await Rutina.findByIdAndUpdate(
                    rutinaId,
                    { clienteId: clienteId },
                    { new: true }
                );
                console.log('Rutina actualizada directamente:', rutinaActualizadaDirecta);
                
                // Método 2: Actualizar el objeto y guardar
                rutina.clienteId = clienteId;
                await rutina.save();
                console.log('Rutina guardada con save():', rutina);
                
                // Verificar que la asignación se haya realizado correctamente
                const rutinaVerificacion = await Rutina.findById(rutinaId);
                console.log('Verificación de asignación:', {
                    rutinaId: rutinaVerificacion._id,
                    clienteId: rutinaVerificacion.clienteId
                });
                
                if (!rutinaVerificacion.clienteId || rutinaVerificacion.clienteId.toString() !== clienteId.toString()) {
                    throw new Error('La asignación no se realizó correctamente');
                }
                
                // Preparar respuesta con datos más completos
                const respuesta = {
                    mensaje: `Rutina '${rutina.nombre}' asignada correctamente al cliente ${cliente.usuarioId.nombre} ${cliente.usuarioId.apellido}`,
                    rutina: {
                        id: rutina._id,
                        nombre: rutina.nombre,
                        descripcion: rutina.descripcion,
                        duracionSemanas: rutina.duracionSemanas
                    },
                    cliente: {
                        id: cliente._id,
                        nombre: cliente.usuarioId.nombre,
                        apellido: cliente.usuarioId.apellido
                    },
                    fechaAsignacion: new Date()
                };
                
                // Devolver respuesta JSON
                return res.status(200).json(respuesta);
                
            } catch (updateError) {
                console.error('Error al actualizar la rutina:', updateError);
                return res.status(500).json({ error: updateError.message });
            }
        } catch (error) {
            console.error('Error al asignar rutina:', error);
            
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(500).json({ error: error.message });
            }
            
            // Redirigir con mensaje de error
            const entrenadorId = req.query.entrenadorId || req.body.entrenadorId;
            return res.redirect(`/frontend/entrenadores/${entrenadorId || 'dashboard'}?error=${encodeURIComponent('Error al asignar rutina: ' + error.message)}`);
        }
    }

    async obtenerRutina(req, res) {
        try {
            console.log('Obteniendo rutina con ID:', req.params.id);
            const rutina = await rutinaService.obtenerRutina(req.params.id);
            
            if (!rutina) {
                console.log('Rutina no encontrada');
                if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                    return res.status(404).json({ error: 'Rutina no encontrada' });
                }
                return res.redirect('/frontend/entrenadores/dashboard?error=Rutina no encontrada');
            }
            
            console.log('Rutina encontrada:', rutina);
            
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.json(rutina);
            }
            
            // Si existe una vista de detalle de rutina, renderizarla
            // De lo contrario, devolver los datos como JSON
            try {
                return res.render('detalleRutina', { rutina });
            } catch (renderError) {
                console.log('Vista no encontrada, devolviendo JSON');
                return res.json(rutina);
            }
        } catch (error) {
            console.error('Error al obtener rutina:', error);
            
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(500).json({ error: error.message });
            }
            
            return res.redirect(`/frontend/entrenadores/dashboard?error=${encodeURIComponent('Error al obtener rutina: ' + error.message)}`);
        }
    }

    async listarRutinas(req, res) {
        try {
            let filtro = {};
            
            // Obtener el ID del entrenador desde la URL o el cuerpo de la solicitud
            const entrenadorId = req.query.entrenadorId || req.body.entrenadorId;
            
            if (entrenadorId) {
                filtro.entrenadorId = entrenadorId;
                console.log('Buscando rutinas para entrenador:', entrenadorId);
            }
            
            console.log('Filtro de búsqueda:', JSON.stringify(filtro));
            const rutinas = await rutinaService.listarRutinas(filtro);
            console.log(`Se encontraron ${rutinas.length} rutinas`);
            
            // Para solicitudes AJAX o API, devolver JSON
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.json(rutinas);
            }
            
            // Para solicitudes normales, renderizar la vista
            return res.render('entrenadorDashboard', {
                rutinas: rutinas,
                ...res.locals // Mantener cualquier otra variable local
            });
        } catch (error) {
            console.error('Error al listar rutinas:', error);
            
            if (req.xhr || req.get('Accept')?.includes('application/json')) {
                return res.status(500).json({ error: error.message });
            }
            
            return res.status(500).send('Error al listar rutinas: ' + error.message);
        }
    }
    
    async actualizarRutina(req, res) {
        try {
            const rutinaId = req.params.id;
            const datosActualizados = req.body;
            
            console.log('Actualizando rutina:', rutinaId, 'con datos:', datosActualizados);
            
            const rutinaActualizada = await rutinaService.actualizarRutina(rutinaId, datosActualizados);
            
            if (!rutinaActualizada) {
                console.log('Rutina no encontrada para actualizar');
                if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                    return res.status(404).json({ error: 'Rutina no encontrada' });
                }
                return res.redirect(`/frontend/entrenadores/dashboard?error=${encodeURIComponent('Rutina no encontrada')}`);
            }
            
            console.log('Rutina actualizada:', rutinaActualizada);
            
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.json(rutinaActualizada);
            }
            
            // Redirigir a la página de detalle de la rutina o al dashboard
            return res.redirect(`/rutinas/${rutinaId}?mensaje=${encodeURIComponent('Rutina actualizada correctamente')}`);
        } catch (error) {
            console.error('Error al actualizar rutina:', error);
            
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(500).json({ error: error.message });
            }
            
            // Redirigir con mensaje de error
            return res.redirect(`/frontend/entrenadores/dashboard?error=${encodeURIComponent('Error al actualizar rutina: ' + error.message)}`);
        }
    }

    async eliminarRutina(req, res) {
        try {
            const rutinaId = req.params.id;
            console.log('Eliminando rutina con ID:', rutinaId);
            
            await rutinaService.eliminarRutina(rutinaId);
            console.log('Rutina eliminada correctamente');
            
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(204).send();
            }
            
            // Redirigir al dashboard con mensaje de éxito
            return res.redirect('/frontend/entrenadores/dashboard?mensaje=Rutina eliminada correctamente');
        } catch (error) {
            console.error('Error al eliminar rutina:', error);
            
            if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
                return res.status(500).json({ error: error.message });
            }
            
            // Redirigir con mensaje de error
            return res.redirect(`/frontend/entrenadores/dashboard?error=${encodeURIComponent('Error al eliminar rutina: ' + error.message)}`);
        }
    }

    async mostrarFormularioEdicion(req, res) {
        try {
            const rutinaId = req.params.id;
            console.log('Mostrando formulario de edición para rutina:', rutinaId);
            
            // Obtener la rutina a editar
            const rutina = await Rutina.findById(rutinaId);
            
            if (!rutina) {
                console.error('Rutina no encontrada:', rutinaId);
                return res.status(404).send('Rutina no encontrada');
            }
            
            // Obtener el entrenador asociado a la rutina
            const entrenador = await Entrenador.findById(rutina.entrenadorId);
            
            if (!entrenador) {
                console.error('Entrenador no encontrado para la rutina:', rutinaId);
                return res.status(404).send('Entrenador no encontrado');
            }
            
            // Renderizar la vista de edición con los datos de la rutina
            return res.render('editarRutina', { 
                rutina,
                entrenador,
                idEntrenador: entrenador._id
            });
        } catch (error) {
            console.error('Error al mostrar formulario de edición:', error);
            return res.status(500).send('Error al cargar el formulario de edición: ' + error.message);
        }
    }

    async mostrarPaginaAsignarRutinaCreacion(req, res) {
        try {
            const rutinaId = req.params.id;
            const idEntrenador = req.session.usuario.entrenadorId;
            
            // Obtener la rutina
            const rutina = await rutinaService.obtenerRutina(rutinaId);
            if (!rutina) {
                return res.status(404).send('Rutina no encontrada');
            }
            
            // Verificar que la rutina pertenezca al entrenador
            if (rutina.entrenadorId.toString() !== idEntrenador) {
                return res.status(403).send('No tienes permiso para asignar esta rutina');
            }
            
            // Obtener los clientes del entrenador
            const Cliente = require('../models/Cliente');
            const clientes = await Cliente.find({ entrenadorId: idEntrenador }).populate('usuarioId', 'nombre apellido');
            
            // Preparar los datos de los clientes para la vista
            const clientesData = clientes.map(cliente => ({
                _id: cliente._id,
                nombre: cliente.usuarioId.nombre,
                apellido: cliente.usuarioId.apellido
            }));
            
            // Renderizar la vista
            res.render('asignarRutinaCreacion', {
                rutina,
                clientes: clientesData,
                idEntrenador,
                mensaje: req.query.mensaje ? {
                    tipo: 'success',
                    texto: req.query.mensaje
                } : null
            });
        } catch (error) {
            console.error('Error al mostrar página de asignación de rutina durante creación:', error);
            res.status(500).send('Error al cargar la página de asignación: ' + error.message);
        }
    }
    
    async asignarRutinaPost(req, res) {
        try {
            const rutinaId = req.params.id;
            const { clienteId, entrenadorId } = req.body;
            
            console.log('Datos recibidos para asignar rutina via POST:', { rutinaId, clienteId, entrenadorId });
            
            if (!rutinaId || !clienteId) {
                return res.status(400).send('Faltan datos requeridos: ID de rutina y cliente son obligatorios');
            }
            
            // Asignar la rutina al cliente
            const rutinaActualizada = await rutinaService.asignarRutina(rutinaId, clienteId);
            
            // Redirigir al dashboard del entrenador con mensaje de éxito
            return res.redirect(`/entrenador/dashboard?mensaje=Rutina asignada correctamente al cliente`);
        } catch (error) {
            console.error('Error al asignar rutina via POST:', error);
            return res.redirect(`/entrenador/dashboard?error=${encodeURIComponent('Error al asignar rutina: ' + error.message)}`);
        }
    }

    // Método para agregar un ejercicio a una rutina
    async agregarEjercicio(req, res) {
        try {
            const rutinaId = req.params.id;
            const { nombre, series, repeticiones, descansoSegundos, diaSemana, instrucciones } = req.body;

            console.log(`Agregando ejercicio a rutina ${rutinaId}:`, req.body);

            if (!nombre || !series || !repeticiones || !descansoSegundos || !diaSemana) {
                return res.status(400).json({ error: 'Faltan datos obligatorios del ejercicio' });
            }

            // Buscar la rutina
            const rutina = await rutinaService.obtenerRutinaPorId(rutinaId);
            if (!rutina) {
                return res.status(404).json({ error: 'Rutina no encontrada' });
            }

            // Crear el nuevo ejercicio
            const nuevoEjercicio = {
                nombre,
                series: parseInt(series),
                repeticiones: parseInt(repeticiones),
                descansoSegundos: parseInt(descansoSegundos),
                instrucciones: instrucciones || ''
            };

            // Verificar si ya existe un objeto para ese día de la semana
            let diaExistente = rutina.ejercicios.find(e => e.diaSemana === diaSemana);

            if (diaExistente) {
                // Si existe, agregar el ejercicio al array de ejercicios de ese día
                diaExistente.ejercicios.push(nuevoEjercicio);
            } else {
                // Si no existe, crear un nuevo objeto para ese día con el ejercicio
                rutina.ejercicios.push({
                    diaSemana,
                    ejercicios: [nuevoEjercicio]
                });
            }

            // Guardar la rutina actualizada
            await rutina.save();

            // Formatear la respuesta para incluir el índice del día y del ejercicio
            const diaIndex = rutina.ejercicios.findIndex(e => e.diaSemana === diaSemana);
            const ejercicioIndex = rutina.ejercicios[diaIndex].ejercicios.length - 1;

            res.status(201).json({
                success: true, 
                mensaje: 'Ejercicio agregado correctamente',
                ejercicio: nuevoEjercicio,
                diaIndex,
                ejercicioIndex,
                diaSemana
            });
        } catch (error) {
            console.error('Error al agregar ejercicio:', error);
            res.status(500).json({ error: 'Error al agregar ejercicio: ' + error.message });
        }
    }

    // Método para editar un ejercicio existente
    async editarEjercicio(req, res) {
        try {
            const rutinaId = req.params.id;
            const { diaIndex, ejercicioIndex } = req.params;
            const { nombre, series, repeticiones, descansoSegundos, instrucciones } = req.body;

            console.log(`Editando ejercicio en rutina ${rutinaId}, día ${diaIndex}, ejercicio ${ejercicioIndex}:`, req.body);

            if (!nombre || !series || !repeticiones || !descansoSegundos) {
                return res.status(400).json({ error: 'Faltan datos obligatorios del ejercicio' });
            }

            // Buscar la rutina
            const rutina = await rutinaService.obtenerRutinaPorId(rutinaId);
            if (!rutina) {
                return res.status(404).json({ error: 'Rutina no encontrada' });
            }

            // Verificar que existan los índices
            if (!rutina.ejercicios[diaIndex] || !rutina.ejercicios[diaIndex].ejercicios[ejercicioIndex]) {
                return res.status(404).json({ error: 'Ejercicio no encontrado' });
            }

            // Actualizar el ejercicio
            rutina.ejercicios[diaIndex].ejercicios[ejercicioIndex] = {
                nombre,
                series: parseInt(series),
                repeticiones: parseInt(repeticiones),
                descansoSegundos: parseInt(descansoSegundos),
                instrucciones: instrucciones || ''
            };

            // Guardar la rutina actualizada
            await rutina.save();

            res.status(200).json({
                success: true, 
                mensaje: 'Ejercicio actualizado correctamente',
                ejercicio: rutina.ejercicios[diaIndex].ejercicios[ejercicioIndex]
            });
        } catch (error) {
            console.error('Error al editar ejercicio:', error);
            res.status(500).json({ error: 'Error al editar ejercicio: ' + error.message });
        }
    }

    // Método para eliminar un ejercicio
    async eliminarEjercicio(req, res) {
        try {
            const rutinaId = req.params.id;
            const { diaIndex, ejercicioIndex } = req.params;

            console.log(`Eliminando ejercicio de rutina ${rutinaId}, día ${diaIndex}, ejercicio ${ejercicioIndex}`);

            // Buscar la rutina
            const rutina = await rutinaService.obtenerRutinaPorId(rutinaId);
            if (!rutina) {
                return res.status(404).json({ error: 'Rutina no encontrada' });
            }

            // Verificar que existan los índices
            if (!rutina.ejercicios[diaIndex] || !rutina.ejercicios[diaIndex].ejercicios[ejercicioIndex]) {
                return res.status(404).json({ error: 'Ejercicio no encontrado' });
            }

            // Eliminar el ejercicio
            rutina.ejercicios[diaIndex].ejercicios.splice(ejercicioIndex, 1);

            // Si no quedan ejercicios en ese día, eliminar el día también
            if (rutina.ejercicios[diaIndex].ejercicios.length === 0) {
                rutina.ejercicios.splice(diaIndex, 1);
            }

            // Guardar la rutina actualizada
            await rutina.save();

            res.status(200).json({
                success: true, 
                mensaje: 'Ejercicio eliminado correctamente'
            });
        } catch (error) {
            console.error('Error al eliminar ejercicio:', error);
            res.status(500).json({ error: 'Error al eliminar ejercicio: ' + error.message });
        }
    }
}

module.exports = new RutinaController();