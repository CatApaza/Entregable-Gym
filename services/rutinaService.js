const Rutina = require('../models/Rutina');

class RutinaService {
    async crearRutina(data) {
        console.log('Creando rutina con datos:', JSON.stringify(data));
        
        // Procesar los días de la semana seleccionados para crear la estructura de ejercicios
        if (data.diasSemana && Array.isArray(data.diasSemana)) {
            // Inicializar el array de ejercicios con los días seleccionados
            data.ejercicios = data.diasSemana.map(dia => ({
                diaSemana: dia,
                ejercicios: [] // Inicialmente sin ejercicios
            }));
            
            // Eliminar diasSemana ya que no es parte del modelo
            delete data.diasSemana;
        }
        
        // Asegurarse de que las fechas estén en formato correcto
        if (data.fechaInicio) {
            data.fechaInicio = new Date(data.fechaInicio);
        }
        
        // Calcular fecha fin basado en duración en semanas si no se proporciona
        if (data.fechaInicio && data.duracionSemanas && !data.fechaFin) {
            const fechaInicio = new Date(data.fechaInicio);
            data.fechaFin = new Date(fechaInicio.setDate(fechaInicio.getDate() + (data.duracionSemanas * 7)));
        }
        
        // Asegurarse de que el entrenadorId sea un string válido
        if (data.entrenadorId) {
            console.log('ID del entrenador antes de crear rutina:', data.entrenadorId);
        }
        
        const nuevaRutina = await Rutina.create(data);
        console.log('Rutina creada con ID:', nuevaRutina._id);
        return nuevaRutina;
    }

    async asignarRutina(rutinaId, clienteId) {
        console.log(`Asignando rutina ${rutinaId} al cliente ${clienteId}`);
        
        try {
            // Verificar que la rutina exista
            const rutina = await Rutina.findById(rutinaId);
            if (!rutina) {
                console.error('Rutina no encontrada:', rutinaId);
                throw new Error('Rutina no encontrada');
            }
            
            console.log('Rutina encontrada:', rutina.nombre);
            
            // Verificar que el clienteId sea un string válido
            if (typeof clienteId === 'string') {
                clienteId = clienteId.trim();
            }
            
            console.log('ID del cliente a asignar:', clienteId);
            
            // Actualizar la rutina con el ID del cliente
            const rutinaActualizada = await Rutina.findByIdAndUpdate(
                rutinaId, 
                { clienteId: clienteId }, 
                { new: true }
            );
            
            if (!rutinaActualizada) {
                throw new Error('No se pudo actualizar la rutina');
            }
            
            console.log('Rutina actualizada correctamente:', rutinaActualizada);
            
            // Verificar que el clienteId se haya asignado correctamente
            if (!rutinaActualizada.clienteId || rutinaActualizada.clienteId.toString() !== clienteId.toString()) {
                console.error('Error: El clienteId no se asignó correctamente', {
                    esperado: clienteId,
                    actual: rutinaActualizada.clienteId
                });
                throw new Error('El clienteId no se asignó correctamente');
            }
            
            return rutinaActualizada;
        } catch (error) {
            console.error('Error al asignar rutina:', error);
            throw error;
        }
    }
    
    async obtenerRutinasPorCliente(clienteId) {
        return await Rutina.find({ clienteId })
            .populate('entrenadorId')
            .sort({ fechaInicio: -1 });
    }

    async obtenerRutina(rutinaId) {
        return await Rutina.findById(rutinaId).populate('clienteId').populate('entrenadorId');
    }
    
    async obtenerRutinaPorId(rutinaId) {
        return await Rutina.findById(rutinaId).populate('clienteId').populate('entrenadorId');
    }

    async listarRutinas(filtro = {}) {
        console.log('Buscando rutinas con filtro:', JSON.stringify(filtro));
        
        // Convertir el ID del entrenador a string si es un objeto ObjectId
        if (filtro.entrenadorId && typeof filtro.entrenadorId === 'object' && filtro.entrenadorId.toString) {
            filtro.entrenadorId = filtro.entrenadorId.toString();
        }
        
        const rutinas = await Rutina.find(filtro)
            .populate('clienteId')
            .populate('entrenadorId')
            .sort({ fechaInicio: -1 }); // Ordenar por fecha de inicio, más recientes primero
        
        console.log(`Se encontraron ${rutinas.length} rutinas`);
        return rutinas;
    }
    
    async listarRutinasDisponiblesParaAsignar(entrenadorId) {
        // Obtener rutinas que pertenecen al entrenador y no están asignadas a ningún cliente
        return await Rutina.find({ 
            entrenadorId: entrenadorId,
            clienteId: { $exists: false }
        }).sort({ fechaInicio: -1 });
    }
    
    async actualizarRutina(rutinaId, data) {
        // Procesar fechas si es necesario
        if (data.fechaInicio) {
            data.fechaInicio = new Date(data.fechaInicio);
        }
        
        if (data.fechaFin) {
            data.fechaFin = new Date(data.fechaFin);
        }
        
        return await Rutina.findByIdAndUpdate(rutinaId, data, { new: true });
    }
    
    async agregarEjercicioADia(rutinaId, diaSemana, ejercicio) {
        const rutina = await Rutina.findById(rutinaId);
        if (!rutina) throw new Error('Rutina no encontrada');
        
        // Buscar el día de la semana
        const diaIndex = rutina.ejercicios.findIndex(e => e.diaSemana === diaSemana);
        
        if (diaIndex === -1) {
            // Si no existe el día, lo creamos
            rutina.ejercicios.push({
                diaSemana,
                ejercicios: [ejercicio]
            });
        } else {
            // Si existe, agregamos el ejercicio
            rutina.ejercicios[diaIndex].ejercicios.push(ejercicio);
        }
        
        return await rutina.save();
    }

    async eliminarRutina(rutinaId) {
        return await Rutina.findByIdAndDelete(rutinaId);
    }
}

module.exports = new RutinaService();