/**
 * EXPLICACIu00d3N DEL FLUJO DE VERIFICACIu00d3N DE ENTRENADORES
 * ====================================================
 * 
 * Este archivo explica el flujo completo de cu00f3mo funciona el sistema de verificaciu00f3n
 * de entrenadores en GimnasioApp.
 */

// PASO 1: El administrador genera un cu00f3digo de verificaciu00f3n
// ---------------------------------------------------------------
// El administrador inicia sesiu00f3n en el sistema y accede al panel de administraciu00f3n
// Desde allu00ed, puede generar un cu00f3digo de verificaciu00f3n para entrenadores

/*
 * Cu00f3digo ejemplo de cu00f3mo se genera un cu00f3digo de verificaciu00f3n:
 */
async function generarCodigoVerificacion(adminId, tipoUsuario) {
    // Generar un cu00f3digo aleatorio
    const crypto = require('crypto');
    const codigo = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Crear una fecha de expiraciu00f3n (7 du00edas desde hoy)
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 7);
    
    // Guardar el cu00f3digo en la base de datos
    const codigoVerificacion = new CodigoVerificacion({
        codigo: codigo,
        tipoUsuario: tipoUsuario,
        generadoPor: adminId,
        fechaCreacion: new Date(),
        fechaExpiracion: fechaExpiracion,
        estado: 'activo'
    });
    
    await codigoVerificacion.save();
    return codigoVerificacion;
}

// PASO 2: El administrador comparte el cu00f3digo con el entrenador
// ---------------------------------------------------------------
// El administrador debe compartir este cu00f3digo con el entrenador que desea verificar
// Esto se hace fuera del sistema (por correo electru00f3nico, en persona, etc.)

/*
 * Ejemplo de cu00f3mo se podru00eda compartir el cu00f3digo:
 */
function ejemploCompartirCodigo() {
    // El administrador copia el cu00f3digo y lo envu00eda al entrenador
    const codigo = "ABC123XYZ";
    const mensaje = `
        Estimado entrenador,
        
        Has sido invitado a unirte a GimnasioApp como entrenador verificado.
        Para completar tu registro, utiliza el siguiente cu00f3digo de verificaciu00f3n:
        
        Cu00d3DIGO: ${codigo}
        
        Este cu00f3digo expira en 7 du00edas.
        
        Saludos,
        El equipo de GimnasioApp
    `;
    
    // Envu00edo por correo, WhatsApp, etc.
}

// PASO 3: El entrenador se registra usando el cu00f3digo
// ---------------------------------------------------------------
// El entrenador accede al formulario de registro y selecciona "Entrenador"
// Completa sus datos y en el campo "Cu00f3digo de verificaciu00f3n" ingresa el cu00f3digo recibido

/*
 * Cu00f3digo ejemplo de cu00f3mo se valida el cu00f3digo durante el registro:
 */
async function validarCodigoVerificacion(codigo, tipoUsuario) {
    // Buscar el cu00f3digo en la base de datos
    const codigoVerificacion = await CodigoVerificacion.findOne({
        codigo: codigo,
        tipoUsuario: tipoUsuario,
        estado: 'activo'
    });
    
    if (!codigoVerificacion) {
        throw new Error('Cu00f3digo de verificaciu00f3n invu00e1lido o ya utilizado');
    }
    
    // Verificar si el cu00f3digo ha expirado
    if (new Date() > new Date(codigoVerificacion.fechaExpiracion)) {
        codigoVerificacion.estado = 'expirado';
        await codigoVerificacion.save();
        throw new Error('El cu00f3digo de verificaciu00f3n ha expirado');
    }
    
    return codigoVerificacion;
}

// PASO 4: El sistema registra al entrenador con estado "pendiente"
// ---------------------------------------------------------------
// Despuu00e9s de validar el cu00f3digo, el sistema registra al entrenador pero con estado "pendiente"
// El cu00f3digo de verificaciu00f3n se marca como "usado"

/*
 * Cu00f3digo ejemplo de cu00f3mo se registra un entrenador:
 */
async function registrarEntrenador(datosUsuario, codigoVerificacion) {
    // Crear el usuario
    const usuario = new Usuario({
        ...datosUsuario,
        tipoUsuario: 'entrenador',
        estado: 'pendiente' // El entrenador queda en estado pendiente hasta verificaciu00f3n final
    });
    
    const usuarioGuardado = await usuario.save();
    
    // Crear el perfil de entrenador
    const entrenador = new Entrenador({
        usuarioId: usuarioGuardado._id,
        especialidad: datosUsuario.especialidad,
        certificaciones: datosUsuario.certificaciones,
        experienciaAnios: datosUsuario.experienciaAnios,
        descripcionPerfil: datosUsuario.descripcionPerfil,
        codigoVerificacion: codigoVerificacion.codigo,
        estado: 'pendiente'
    });
    
    await entrenador.save();
    
    // Marcar el cu00f3digo como usado
    codigoVerificacion.estado = 'usado';
    codigoVerificacion.usadoPor = usuarioGuardado._id;
    codigoVerificacion.fechaUso = new Date();
    await codigoVerificacion.save();
    
    return { usuario: usuarioGuardado, entrenador };
}

// PASO 5: El administrador verifica al entrenador
// ---------------------------------------------------------------
// El administrador ve en su panel que hay un nuevo entrenador pendiente de verificaciu00f3n
// Revisa sus datos y lo verifica manualmente

/*
 * Cu00f3digo ejemplo de cu00f3mo se verifica un entrenador:
 */
async function verificarEntrenador(entrenadorId, adminId) {
    // Buscar el entrenador
    const entrenador = await Entrenador.findById(entrenadorId);
    if (!entrenador) {
        throw new Error('Entrenador no encontrado');
    }
    
    // Buscar el usuario asociado
    const usuario = await Usuario.findById(entrenador.usuarioId);
    if (!usuario) {
        throw new Error('Usuario no encontrado');
    }
    
    // Actualizar estado del entrenador
    entrenador.verificado = true;
    entrenador.fechaVerificacion = new Date();
    entrenador.verificadoPor = adminId;
    entrenador.estado = 'activo';
    await entrenador.save();
    
    // Actualizar estado del usuario
    usuario.estado = 'activo';
    usuario.verificado = true;
    await usuario.save();
    
    return { entrenador, usuario };
}

// RESUMEN DEL FLUJO
// ---------------------------------------------------------------
// 1. Administrador genera cu00f3digo de verificaciu00f3n
// 2. Administrador comparte el cu00f3digo con el entrenador
// 3. Entrenador se registra usando el cu00f3digo
// 4. Sistema registra al entrenador con estado "pendiente"
// 5. Administrador verifica al entrenador
// 6. Entrenador puede iniciar sesiu00f3n y usar el sistema
