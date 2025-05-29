const Cita = require('../models/Cita');

// Función auxiliar para convertir hora en formato HH:MM a minutos
function convertirHoraAMinutos(hora) {
    const [horas, minutos] = hora.split(':').map(Number);
    return (horas * 60) + minutos;
}

class CitaService {
    // Crear una nueva cita
    async crearCita(dataCita) {
        try {
            const nuevaCita = new Cita(dataCita);
            return await nuevaCita.save();
        } catch (error) {
            console.error('Error al crear cita:', error);
            throw error;
        }
    }

    // Obtener todas las citas de un entrenador
    async obtenerCitasPorEntrenador(entrenadorId) {
        try {
            console.log(`Buscando citas para el entrenador con ID: ${entrenadorId}`);
            
            const citas = await Cita.find({ entrenadorId })
                .populate('clienteId', 'usuarioId')
                .populate({
                    path: 'clienteId',
                    populate: {
                        path: 'usuarioId',
                        select: 'nombre apellido correo'
                    }
                })
                .sort({ fecha: 1, horaInicio: 1 });
            
            console.log(`Se encontraron ${citas.length} citas para el entrenador ${entrenadorId}`);
            if (citas.length > 0) {
                console.log('Primera cita:', {
                    id: citas[0]._id,
                    fecha: citas[0].fecha,
                    horaInicio: citas[0].horaInicio,
                    horaFin: citas[0].horaFin,
                    estado: citas[0].estado
                });
            }
            
            return citas;
        } catch (error) {
            console.error('Error al obtener citas del entrenador:', error);
            throw error;
        }
    }

    // Obtener todas las citas de un cliente
    async obtenerCitasPorCliente(clienteId) {
        try {
            return await Cita.find({ clienteId })
                .populate('entrenadorId', 'usuarioId')
                .populate({
                    path: 'entrenadorId',
                    populate: {
                        path: 'usuarioId',
                        select: 'nombre apellido correo'
                    }
                })
                .sort({ fecha: 1, horaInicio: 1 });
        } catch (error) {
            console.error('Error al obtener citas del cliente:', error);
            throw error;
        }
    }

    // Obtener una cita por su ID
    async obtenerCitaPorId(citaId) {
        try {
            return await Cita.findById(citaId)
                .populate('clienteId', 'usuarioId')
                .populate('entrenadorId', 'usuarioId')
                .populate({
                    path: 'clienteId',
                    populate: {
                        path: 'usuarioId',
                        select: 'nombre apellido correo'
                    }
                })
                .populate({
                    path: 'entrenadorId',
                    populate: {
                        path: 'usuarioId',
                        select: 'nombre apellido correo'
                    }
                });
        } catch (error) {
            console.error('Error al obtener cita:', error);
            throw error;
        }
    }

    // Actualizar una cita
    async actualizarCita(citaId, datosActualizados) {
        try {
            return await Cita.findByIdAndUpdate(
                citaId,
                datosActualizados,
                { new: true, runValidators: true }
            );
        } catch (error) {
            console.error('Error al actualizar cita:', error);
            throw error;
        }
    }

    // Cambiar el estado de una cita
    async cambiarEstadoCita(citaId, nuevoEstado) {
        try {
            return await Cita.findByIdAndUpdate(
                citaId,
                { estado: nuevoEstado },
                { new: true }
            );
        } catch (error) {
            console.error('Error al cambiar estado de la cita:', error);
            throw error;
        }
    }

    // Eliminar una cita
    async eliminarCita(citaId) {
        try {
            return await Cita.findByIdAndDelete(citaId);
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            throw error;
        }
    }

    // Verificar disponibilidad del entrenador
    async verificarDisponibilidad(entrenadorId, fecha, horaInicio, horaFin, citaIdExcluir = null) {
        try {
            console.log(`Verificando disponibilidad para: ${entrenadorId}, ${fecha}, ${horaInicio}-${horaFin}`);
            
            // Obtener todas las citas del entrenador para esa fecha
            const fechaObj = new Date(fecha);
            const inicioDelDia = new Date(fechaObj);
            inicioDelDia.setHours(0, 0, 0, 0);
            
            const finDelDia = new Date(fechaObj);
            finDelDia.setHours(23, 59, 59, 999);
            
            const citasDelDia = await Cita.find({
                entrenadorId,
                fecha: { $gte: inicioDelDia, $lte: finDelDia },
                estado: { $ne: 'Cancelada' }
            });
            
            // Si estamos actualizando una cita existente, excluirla
            const citasFiltradas = citaIdExcluir 
                ? citasDelDia.filter(cita => cita._id.toString() !== citaIdExcluir)
                : citasDelDia;
            
            console.log(`Encontradas ${citasFiltradas.length} citas para el día ${fecha}`);
            
            // Convertir horas a minutos para facilitar la comparación
            const horaInicioMinutos = convertirHoraAMinutos(horaInicio);
            const horaFinMinutos = convertirHoraAMinutos(horaFin);
            
            // Verificar si hay superposición con alguna cita existente
            for (const cita of citasFiltradas) {
                const citaInicioMinutos = convertirHoraAMinutos(cita.horaInicio);
                const citaFinMinutos = convertirHoraAMinutos(cita.horaFin);
                
                // Verificar superposición
                if (!(horaFinMinutos <= citaInicioMinutos || horaInicioMinutos >= citaFinMinutos)) {
                    console.log(`Conflicto con cita existente: ${cita.horaInicio}-${cita.horaFin}`);
                    return false; // Hay superposición
                }
            }
            
            console.log('Horario disponible');
            return true; // No hay superposición
        } catch (error) {
            console.error('Error al verificar disponibilidad:', error);
            throw error;
        }
    }



    // Obtener citas para un día específico
    async obtenerCitasPorFecha(entrenadorId, fecha) {
        try {
            // Crear un objeto Date para la fecha proporcionada
            const fechaObj = new Date(fecha);
            const fechaInicio = new Date(fechaObj.setHours(0, 0, 0, 0));
            const fechaFin = new Date(fechaObj.setHours(23, 59, 59, 999));

            return await Cita.find({
                entrenadorId,
                fecha: { $gte: fechaInicio, $lte: fechaFin }
            })
            .populate('clienteId', 'usuarioId')
            .populate({
                path: 'clienteId',
                populate: {
                    path: 'usuarioId',
                    select: 'nombre apellido correo'
                }
            })
            .sort({ horaInicio: 1 });
        } catch (error) {
            console.error('Error al obtener citas por fecha:', error);
            throw error;
        }
    }
}

module.exports = new CitaService();
