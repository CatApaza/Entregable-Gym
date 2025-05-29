const Dieta = require('../models/Dieta');
const Cliente = require('../models/Cliente');
const Entrenador = require('../models/Entrenador');

class DietaService {
    async crearDieta(data) {
        try {
            console.log('Datos recibidos en servicio crearDieta:', JSON.stringify(data, null, 2));
            
            // Validar que el entrenador exista
            if (data.entrenadorId) {
                console.log('Buscando entrenador con ID:', data.entrenadorId);
                
                // Intentar encontrar el entrenador directamente por ID primero
                let entrenador = await Entrenador.findById(data.entrenadorId);
                
                // Si no se encuentra, intentar buscar por usuarioId
                if (!entrenador) {
                    console.log('No se encontró entrenador por ID directo, buscando por usuarioId');
                    entrenador = await Entrenador.findOne({ usuarioId: data.entrenadorId });
                }
                
                if (!entrenador) {
                    console.log('No se encontró ningún entrenador con ID:', data.entrenadorId);
                    // En lugar de lanzar un error, vamos a continuar y ver si podemos crear la dieta de todos modos
                    console.warn('Advertencia: Creando dieta sin validar entrenador');
                } else {
                    console.log('Entrenador encontrado:', entrenador._id);
                }
            } else {
                console.warn('No se proporcionó ID de entrenador');
            }
            
            // Validar que el cliente exista si se proporciona
            if (data.clienteId) {
                console.log('Buscando cliente con ID:', data.clienteId);
                
                // Intentar encontrar el cliente directamente por ID primero
                let cliente = await Cliente.findById(data.clienteId);
                
                // Si no se encuentra, intentar buscar por usuarioId
                if (!cliente) {
                    console.log('No se encontró cliente por ID directo, buscando por usuarioId');
                    cliente = await Cliente.findOne({ usuarioId: data.clienteId });
                }
                
                if (!cliente) {
                    console.log('No se encontró ningún cliente con ID:', data.clienteId);
                    // En lugar de lanzar un error, vamos a continuar y ver si podemos crear la dieta de todos modos
                    console.warn('Advertencia: Creando dieta sin validar cliente');
                } else {
                    console.log('Cliente encontrado:', cliente._id);
                }
            }
            
            // Crear la dieta
            console.log('Intentando crear dieta con datos:', JSON.stringify(data, null, 2));
            const nuevaDieta = await Dieta.create(data);
            console.log('Dieta creada exitosamente con ID:', nuevaDieta._id);
            return nuevaDieta;
        } catch (error) {
            console.error('Error en servicio crearDieta:', error);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }

    async asignarDieta(dietaId, clienteId) {
        try {
            console.log(`Servicio asignarDieta - dietaId: ${dietaId}, clienteId: ${clienteId}`);
            
            // Validar que la dieta exista
            const dieta = await Dieta.findById(dietaId);
            if (!dieta) {
                throw new Error('Dieta no encontrada');
            }
            console.log('Dieta encontrada:', dieta);
            
            // Validar que el cliente exista - intentar buscar por _id primero
            let cliente = await Cliente.findById(clienteId);
            
            // Si no se encuentra, intentar buscar por usuarioId
            if (!cliente) {
                console.log('No se encontró cliente por _id, buscando por usuarioId');
                cliente = await Cliente.findOne({ usuarioId: clienteId });
            }
            
            if (!cliente) {
                throw new Error(`Cliente no encontrado con ID: ${clienteId}`);
            }
            console.log('Cliente encontrado:', cliente);
            
            // Asignar la dieta al cliente
            dieta.clienteId = clienteId;
            await dieta.save();
            console.log('Dieta asignada y guardada correctamente');
            
            return await dieta.populate('clienteId').populate('entrenadorId');
        } catch (error) {
            console.error('Error en servicio asignarDieta:', error);
            throw error;
        }
    }

    async obtenerDieta(dietaId) {
        try {
            const dieta = await Dieta.findById(dietaId)
                .populate('clienteId', 'nombre apellido correo')
                .populate('entrenadorId', 'nombre apellido correo');
                
            if (!dieta) {
                throw new Error('Dieta no encontrada');
            }
            
            return dieta;
        } catch (error) {
            console.error('Error en servicio obtenerDieta:', error);
            throw error;
        }
    }
    
    async obtenerDietaPorId(dietaId) {
        try {
            const dieta = await Dieta.findById(dietaId)
                .populate('clienteId', 'nombre apellido correo')
                .populate('entrenadorId', 'nombre apellido correo');
                
            if (!dieta) {
                throw new Error('Dieta no encontrada');
            }
            
            return dieta;
        } catch (error) {
            console.error('Error en servicio obtenerDietaPorId:', error);
            throw error;
        }
    }

    async listarDietas() {
        try {
            return await Dieta.find()
                .populate('clienteId', 'nombre apellido correo')
                .populate('entrenadorId', 'nombre apellido correo')
                .sort({ fechaInicio: -1 });
        } catch (error) {
            console.error('Error en servicio listarDietas:', error);
            throw error;
        }
    }
    
    async listarDietasPorEntrenador(entrenadorId) {
        try {
            return await Dieta.find({ entrenadorId })
                .populate('clienteId', 'nombre apellido correo')
                .populate('entrenadorId', 'nombre apellido correo')
                .sort({ fechaInicio: -1 });
        } catch (error) {
            console.error('Error en servicio listarDietasPorEntrenador:', error);
            throw error;
        }
    }
    
    async listarDietasPorCliente(clienteId) {
        try {
            return await Dieta.find({ clienteId })
                .populate('clienteId', 'nombre apellido correo')
                .populate('entrenadorId', 'nombre apellido correo')
                .sort({ fechaInicio: -1 });
        } catch (error) {
            console.error('Error en servicio listarDietasPorCliente:', error);
            throw error;
        }
    }

    async eliminarDieta(dietaId) {
        try {
            const dieta = await Dieta.findById(dietaId);
            if (!dieta) {
                throw new Error('Dieta no encontrada');
            }
            
            return await Dieta.findByIdAndDelete(dietaId);
        } catch (error) {
            console.error('Error en servicio eliminarDieta:', error);
            throw error;
        }
    }
    
    async actualizarDieta(dietaId, datosActualizados) {
        try {
            const dieta = await Dieta.findById(dietaId);
            if (!dieta) {
                throw new Error('Dieta no encontrada');
            }
            
            // Actualizar solo los campos permitidos
            const camposPermitidos = ['nombre', 'descripcion', 'fechaInicio', 'fechaFin', 'comidas'];
            for (const campo of camposPermitidos) {
                if (datosActualizados[campo] !== undefined) {
                    dieta[campo] = datosActualizados[campo];
                }
            }
            
            await dieta.save();
            return await dieta.populate('clienteId').populate('entrenadorId');
        } catch (error) {
            console.error('Error en servicio actualizarDieta:', error);
            throw error;
        }
    }
}

module.exports = new DietaService();