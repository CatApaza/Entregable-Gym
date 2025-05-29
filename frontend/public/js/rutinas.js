// Funciones para gestionar rutinas

// Variable para controlar si ya se está enviando una solicitud
let enviandoRutina = false;

// Función para crear nueva rutina
function crearNuevaRutina(event) {
    // Prevenir comportamiento por defecto del formulario
    event.preventDefault();
    
    // Evitar envíos duplicados
    if (enviandoRutina) {
        console.log('Ya hay una solicitud en proceso');
        return false;
    }
    
    // Marcar como enviando
    enviandoRutina = true;
    
    // Obtener el botón de envío y mostrar indicador de carga
    const submitBtn = document.getElementById('crearRutinaBtn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando...';
    submitBtn.disabled = true;
    
    // Obtener el formulario
    const form = document.getElementById('nuevaRutinaForm');
    
    // Recopilar datos del formulario
    const formData = new FormData(form);
    
    // Obtener los días de la semana seleccionados
    const diasSemana = [];
    form.querySelectorAll('input[name="diasSemana[]"]:checked').forEach(checkbox => {
        diasSemana.push(checkbox.value);
    });
    
    // Comprobar si se quiere asignar a un cliente directamente
    const clienteSelector = document.getElementById('clienteId');
    const asignarCliente = document.getElementById('asignarCliente')?.checked || false;
    
    // Crear objeto de datos
    const rutinaData = {
        nombre: formData.get('nombre'),
        descripcion: formData.get('descripcion'),
        duracionSemanas: formData.get('duracionSemanas'),
        fechaInicio: formData.get('fechaInicio'),
        estado: formData.get('estado'),
        entrenadorId: formData.get('entrenadorId'),
        diasSemana: diasSemana
    };
    
    // Añadir datos de asignación de cliente si está activada la opción
    if (asignarCliente && clienteSelector && clienteSelector.value) {
        rutinaData.asignarCliente = true;
        rutinaData.clienteId = clienteSelector.value;
    }
    
    console.log('Enviando datos de rutina:', rutinaData);
    
    // Enviar datos al servidor
    fetch('/rutinas/crear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(rutinaData)
    })
    .then(response => {
        // Verificar si la respuesta es JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Error al crear la rutina');
                });
            }
            return response.json();
        } else {
            // Si no es JSON, es posible que sea una redirección o error
            if (!response.ok) {
                throw new Error('Error al crear la rutina: ' + response.status);
            }
            // Intentar obtener el texto de la respuesta para depuración
            return response.text().then(text => {
                console.warn('Respuesta no JSON recibida:', text);
                // Devolver un objeto simulado para continuar el flujo
                return {
                    _id: new Date().getTime(), // ID temporal
                    nombre: rutinaData.nombre,
                    descripcion: rutinaData.descripcion,
                    duracionSemanas: rutinaData.duracionSemanas,
                    fechaInicio: rutinaData.fechaInicio,
                    estado: rutinaData.estado,
                    entrenadorId: rutinaData.entrenadorId,
                    clienteId: rutinaData.clienteId || null
                };
            });
        }
    })
    .then(data => {
        console.log('Rutina creada con éxito:', data);
        
        // Mostrar mensaje de éxito con información de asignación
        let mensaje = 'Rutina creada con éxito';
        if (data.mensaje) {
            mensaje = data.mensaje; // Si incluye mensaje de asignación
        }
        mostrarAlerta(mensaje, 'success');
        
        // Limpiar completamente el formulario
        form.reset();
        
        // Desmarcar todos los checkboxes de días
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Restablecer los valores predeterminados
        const duracionInput = document.getElementById('duracionSemanas');
        if (duracionInput) duracionInput.value = '4';
        
        const fechaInput = document.getElementById('fechaInicio');
        if (fechaInput) fechaInput.value = '';
        
        const estadoSelect = document.getElementById('estado');
        if (estadoSelect) estadoSelect.selectedIndex = 0;
        
        const clienteSelect = document.getElementById('clienteId');
        if (clienteSelect) clienteSelect.selectedIndex = 0;
        
        // Si hay datos válidos, agregar la rutina a la tabla
        if (data && data._id) {
            agregarRutinaATabla(data);
        }
        
        // Hacer visible la tabla si está oculta
        const tablaContainer = document.querySelector('.table-responsive');
        if (tablaContainer) {
            tablaContainer.style.display = 'block';
        }
        
        // Scroll hacia la tabla para mostrar la nueva rutina
        const tablaDietas = document.getElementById('rutinasTableBody');
        if (tablaDietas) {
            tablaDietas.scrollIntoView({ behavior: 'smooth' });
        }
    })
    .catch(error => {
        console.error('Error al crear rutina:', error);
        mostrarAlerta('Error: ' + error.message, 'danger');
    })
    .finally(() => {
        // Restaurar el botón
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        enviandoRutina = false;
    });
    
    return false;
}

// Función para mostrar alertas
function mostrarAlerta(mensaje, tipo) {
    // Crear el elemento de alerta
    const alertaDiv = document.createElement('div');
    alertaDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertaDiv.role = 'alert';
    alertaDiv.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Buscar el contenedor donde mostrar la alerta
    const contenedor = document.querySelector('.main-container');
    if (contenedor) {
        // Insertar al principio del contenedor
        contenedor.insertBefore(alertaDiv, contenedor.firstChild);
        
        // Configurar para que desaparezca después de 5 segundos
        setTimeout(() => {
            alertaDiv.classList.remove('show');
            setTimeout(() => alertaDiv.remove(), 300);
        }, 5000);
    }
}

// Función para agregar una rutina a la tabla
function agregarRutinaATabla(rutina) {
    console.log('Agregando rutina a tabla:', rutina);
    
    // Obtener la tabla
    const tabla = document.getElementById('rutinasTableBody');
    if (!tabla) {
        console.error('No se encontró la tabla de rutinas');
        return;
    }
    
    // Crear una nueva fila
    const fila = document.createElement('tr');
    
    // Formatear la fecha
    let fechaFormateada = 'No definida';
    if (rutina.fechaInicio) {
        try {
            fechaFormateada = new Date(rutina.fechaInicio).toLocaleDateString();
        } catch (e) {
            console.error('Error al formatear fecha:', e);
        }
    }
    
    // Determinar la clase de la insignia según el estado
    let badgeClass = 'badge-secondary';
    if (rutina.estado === 'Activa') {
        badgeClass = 'badge-success';
    } else if (rutina.estado === 'Inactiva') {
        badgeClass = 'badge-warning';
    }
    
    // Verificar si la rutina ya está asignada a un cliente
    const yaAsignada = rutina.clienteId || (rutina.asignarCliente && rutina.clienteId);
    
    // Crear elementos manualmente en lugar de usar innerHTML para preservar los eventos
    // Añadir celdas para cada columna
    const celdaNombre = document.createElement('td');
    celdaNombre.textContent = rutina.nombre;
    fila.appendChild(celdaNombre);

    const celdaDescripcion = document.createElement('td');
    celdaDescripcion.textContent = rutina.descripcion || 'Sin descripción';
    fila.appendChild(celdaDescripcion);

    const celdaDuracion = document.createElement('td');
    celdaDuracion.textContent = `${rutina.duracionSemanas} semanas`;
    fila.appendChild(celdaDuracion);

    const celdaFecha = document.createElement('td');
    celdaFecha.textContent = fechaFormateada;
    fila.appendChild(celdaFecha);

    // Celda para el estado
    const celdaEstado = document.createElement('td');
    const spanEstado = document.createElement('span');
    spanEstado.className = `badge badge-custom ${badgeClass}`;
    spanEstado.textContent = rutina.estado;
    celdaEstado.appendChild(spanEstado);
    fila.appendChild(celdaEstado);

    // Celda para los botones de acción
    const celdaAcciones = document.createElement('td');
    
    // Botón Ver
    const btnVer = document.createElement('a');
    btnVer.href = `/rutinas/${rutina._id}`;
    btnVer.className = 'btn btn-sm btn-primary me-2 verRutinaBtn';
    btnVer.textContent = 'Ver';
    celdaAcciones.appendChild(btnVer);
    
    // Botón Asignar/Asignada
    if (yaAsignada) {
        const btnAsignada = document.createElement('button');
        btnAsignada.className = 'btn btn-sm btn-secondary';
        btnAsignada.disabled = true;
        btnAsignada.textContent = 'Asignada';
        celdaAcciones.appendChild(btnAsignada);
    } else {
        const btnAsignar = document.createElement('a');
        btnAsignar.href = `/rutinas/${rutina._id}/asignar/${rutina.entrenadorId}`;
        btnAsignar.className = 'btn btn-sm btn-success';
        btnAsignar.textContent = 'Asignar';
        celdaAcciones.appendChild(btnAsignar);
    }
    
    // Botón Editar
    const btnEditar = document.createElement('a');
    btnEditar.href = `/rutinas/${rutina._id}/editar`;
    btnEditar.className = 'btn btn-sm btn-warning editarRutinaBtn';
    btnEditar.textContent = 'Editar';
    btnEditar.style.marginLeft = '4px';
    celdaAcciones.appendChild(btnEditar);
    
    fila.appendChild(celdaAcciones);
    
    // Eliminar el mensaje "No hay rutinas disponibles" si existe
    const mensajeNoRutinas = tabla.querySelector('tr td[colspan="6"]');
    if (mensajeNoRutinas && mensajeNoRutinas.textContent.includes('No hay rutinas disponibles')) {
        mensajeNoRutinas.parentNode.remove();
    }
    
    // Insertar la fila al principio de la tabla
    if (tabla.firstChild) {
        tabla.insertBefore(fila, tabla.firstChild);
    } else {
        tabla.appendChild(fila);
    }
    
    console.log('Rutina agregada exitosamente a la tabla');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Configurar el formulario de nueva rutina
    const formNuevaRutina = document.getElementById('nuevaRutinaForm');
    if (formNuevaRutina) {
        formNuevaRutina.addEventListener('submit', crearNuevaRutina);
    }
});
