const Cliente = require('../models/Cliente');

/**
 * Middleware para verificar si un ID corresponde a un cliente válido
 */
exports.verificarCliente = async (req, res, next) => {
    try {
        // Buscar el ID del cliente en diferentes ubicaciones
        let clienteId = req.params.clienteId || req.body.clienteId;
        
        // Si no hay ID en params o body, y hay un usuario autenticado, intentar buscar el cliente por usuario
        if (!clienteId && req.user && req.user.id) {
            const clientePorUsuario = await Cliente.findOne({ usuarioId: req.user.id });
            if (clientePorUsuario) {
                clienteId = clientePorUsuario._id;
            }
        }
        
        if (!clienteId) {
            console.error('ID de cliente no proporcionado en la solicitud');
            return res.status(400).json({ 
                success: false, 
                mensaje: 'ID de cliente no proporcionado' 
            });
        }

        console.log(`Verificando cliente con ID: ${clienteId}`);
        
        // Verificar si el cliente existe
        const cliente = await Cliente.findById(clienteId);
        
        if (!cliente) {
            console.error(`Cliente con ID ${clienteId} no encontrado`);
            return res.status(404).json({ 
                success: false, 
                mensaje: 'Cliente no encontrado' 
            });
        }
        
        // Agregar el cliente a la solicitud para uso posterior
        req.cliente = cliente;
        next();
    } catch (error) {
        console.error('Error en verificarCliente middleware:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al verificar cliente',
            error: error.message 
        });
    }
};
