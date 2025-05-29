const dietaService = require('../services/dietaService');

class DietaController {
    async crearDieta(req, res) {
        try {
            console.log('==== INICIO CREAR DIETA ====');
            console.log('Datos recibidos para crear dieta:', JSON.stringify(req.body, null, 2));
            console.log('Sesión actual:', req.session ? JSON.stringify(req.session.usuario, null, 2) : 'No hay sesión');
            
            // Validar datos requeridos
            if (!req.body.nombre) {
                console.log('Error: Nombre de dieta no proporcionado');
                return res.status(400).json({ error: 'El nombre de la dieta es obligatorio' });
            }
            
            // Si no se proporcionó entrenadorId en el cuerpo, intentar obtenerlo de la sesión
            if (!req.body.entrenadorId && req.session && req.session.usuario && req.session.usuario._id) {
                console.log('Usando ID de entrenador de la sesión:', req.session.usuario._id);
                req.body.entrenadorId = req.session.usuario._id;
            }
            
            if (!req.body.entrenadorId) {
                console.log('Error: ID de entrenador no proporcionado');
                return res.status(400).json({ error: 'El ID del entrenador es obligatorio' });
            }
            
            if (!req.body.comidas || !Array.isArray(req.body.comidas) || req.body.comidas.length === 0) {
                console.log('Error: No se proporcionaron comidas o el formato es incorrecto');
                return res.status(400).json({ error: 'Debe incluir al menos una comida en el plan nutricional' });
            }
            
            console.log('Datos validados correctamente, llamando al servicio...');
            
            // Crear la dieta
            const nuevaDieta = await dietaService.crearDieta(req.body);
            console.log('Dieta creada exitosamente:', nuevaDieta._id);
            
            // Obtener la dieta completa con todas sus propiedades para devolverla
            const dietaCompleta = await dietaService.obtenerDietaPorId(nuevaDieta._id);
            console.log('Dieta completa obtenida:', dietaCompleta._id);
            console.log('==== FIN CREAR DIETA ====');
            
            // Devolver la dieta completa
            res.status(201).json(dietaCompleta);
        } catch (error) {
            console.error('==== ERROR AL CREAR DIETA ====');
            console.error('Error al crear dieta:', error);
            console.error('Mensaje de error:', error.message);
            console.error('Stack trace:', error.stack);
            console.error('==== FIN ERROR ====');
            res.status(500).json({ error: error.message });
        }
    }

    async asignarDieta(req, res) {
        try {
            const { dietaId, clienteId } = req.body;
            
            if (!dietaId || !clienteId) {
                return res.status(400).json({ error: 'Los IDs de dieta y cliente son obligatorios' });
            }
            
            console.log(`Asignando dieta ${dietaId} al cliente ${clienteId}`);
            const dietaActualizada = await dietaService.asignarDieta(dietaId, clienteId);
            res.json(dietaActualizada);
        } catch (error) {
            console.error('Error al asignar dieta:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async obtenerDieta(req, res) {
        try {
            const dieta = await dietaService.obtenerDieta(req.params.id);
            if (!dieta) {
                return res.status(404).json({ error: 'Dieta no encontrada' });
            }
            res.json(dieta);
        } catch (error) {
            console.error('Error al obtener dieta:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async listarDietas(req, res) {
        try {
            const dietas = await dietaService.listarDietas();
            res.json(dietas);
        } catch (error) {
            console.error('Error al listar dietas:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async listarDietasPorEntrenador(req, res) {
        try {
            // Obtener el ID del entrenador de los parámetros o de la sesión
            let entrenadorId = req.params.entrenadorId;
            
            // Si no hay ID en los parámetros, intentar obtenerlo de la sesión
            if (!entrenadorId && req.session && req.session.usuario) {
                entrenadorId = req.session.usuario._id;
                console.log('Usando ID de entrenador de la sesión:', entrenadorId);
            }
            
            if (!entrenadorId) {
                return res.status(400).json({ error: 'ID de entrenador no proporcionado' });
            }
            
            console.log(`Obteniendo dietas para el entrenador ${entrenadorId}`);
            const dietas = await dietaService.listarDietasPorEntrenador(entrenadorId);
            console.log(`Se encontraron ${dietas.length} dietas para el entrenador`);
            res.json(dietas);
        } catch (error) {
            console.error('Error al listar dietas por entrenador:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async listarDietasPorCliente(req, res) {
        try {
            const clienteId = req.params.clienteId;
            
            if (!clienteId) {
                return res.status(400).json({ error: 'ID de cliente no proporcionado' });
            }
            
            console.log(`Obteniendo dietas para el cliente ${clienteId}`);
            const dietas = await dietaService.listarDietasPorCliente(clienteId);
            res.json(dietas);
        } catch (error) {
            console.error('Error al listar dietas por cliente:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async eliminarDieta(req, res) {
        try {
            await dietaService.eliminarDieta(req.params.id);
            res.status(204).send();
        } catch (error) {
            console.error('Error al eliminar dieta:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async actualizarDieta(req, res) {
        try {
            const dietaId = req.params.id;
            const datosActualizados = req.body;
            
            if (!dietaId) {
                return res.status(400).json({ error: 'ID de dieta no proporcionado' });
            }
            
            console.log(`Actualizando dieta ${dietaId}`);
            const dietaActualizada = await dietaService.actualizarDieta(dietaId, datosActualizados);
            res.json(dietaActualizada);
        } catch (error) {
            console.error('Error al actualizar dieta:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Método para mostrar la página de asignación de dietas
    async mostrarPaginaAsignarDieta(req, res) {
        try {
            console.log('Mostrando página de asignación de dieta');
            console.log('Sesión:', req.session);
            
            const dietaId = req.params.id;
            
            if (!dietaId) {
                console.error('ID de dieta no proporcionado');
                return res.status(400).send('ID de dieta no proporcionado');
            }
            
            // Obtener la dieta
            const dieta = await dietaService.obtenerDieta(dietaId);
            if (!dieta) {
                console.error('Dieta no encontrada');
                return res.status(404).send('Dieta no encontrada');
            }
            
            console.log('Dieta encontrada:', dieta._id);
            
            // Obtener el entrenador de la sesión o de la dieta
            let entrenadorId = null;
            
            // Intentar obtener el ID del entrenador de la sesión
            if (req.session && req.session.usuario) {
                console.log('Usando ID de entrenador de la sesión:', req.session.usuario._id);
                entrenadorId = req.session.usuario._id;
            }
            
            // Si no hay ID en la sesión, usar el ID del entrenador de la dieta
            if (!entrenadorId && dieta.entrenadorId) {
                console.log('Usando ID de entrenador de la dieta:', dieta.entrenadorId);
                entrenadorId = dieta.entrenadorId;
            }
            
            if (!entrenadorId) {
                console.error('No se pudo obtener el ID del entrenador');
                return res.status(401).send('No se pudo obtener el ID del entrenador');
            }
            
            // Obtener los clientes del entrenador
            const ClienteService = require('../services/clienteService');
            const EntrenadorService = require('../services/entrenadorService');
            
            // Obtener el entrenador completo
            const entrenador = await EntrenadorService.obtenerEntrenadorPorId(entrenadorId);
            if (!entrenador) {
                console.error('Entrenador no encontrado');
                return res.status(404).send('Entrenador no encontrado');
            }
            
            console.log('Entrenador encontrado:', entrenador._id);
            
            // Obtener los clientes del entrenador
            const clientes = await ClienteService.obtenerClientesPorEntrenador(entrenador._id);
            console.log(`Se encontraron ${clientes.length} clientes para el entrenador`);
            
            // Renderizar la vista
            res.render('asignarDieta', {
                title: 'Asignar Plan Nutricional',
                dieta: dieta,
                clientes: clientes,
                usuario: req.session?.usuario || {},
                idEntrenador: entrenador._id
            });
        } catch (error) {
            console.error('Error al mostrar la página de asignación de dietas:', error);
            res.status(500).render('error', { error: error.message });
        }
    }
    
    // Método para procesar la asignación de dietas mediante POST
    async asignarDietaPost(req, res) {
        try {
            const dietaId = req.params.id;
            const { clienteId } = req.body;
            
            if (!dietaId || !clienteId) {
                return res.status(400).json({ error: 'Los IDs de dieta y cliente son obligatorios' });
            }
            
            console.log(`Asignando dieta ${dietaId} al cliente ${clienteId}`);
            const dietaActualizada = await dietaService.asignarDieta(dietaId, clienteId);
            
            // Redireccionar a la página de dietas con un mensaje de éxito
            req.session.mensaje = { tipo: 'success', texto: 'Plan nutricional asignado correctamente' };
            res.redirect('/entrenador/dashboard');
        } catch (error) {
            console.error('Error al asignar dieta:', error);
            req.session.mensaje = { tipo: 'danger', texto: `Error al asignar plan nutricional: ${error.message}` };
            res.redirect(`/dietas/asignar/${req.params.id}`);
        }
    }
}

module.exports = new DietaController();