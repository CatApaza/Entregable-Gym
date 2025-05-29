// Función para crear una nueva dieta mediante AJAX
function crearNuevaDieta(event) {
    event.preventDefault();
    console.log('Creando nueva dieta...');
    
    const form = document.getElementById('nuevaDietaForm');
    const formData = new FormData(form);
    const dietaData = {};
    
    // Convertir FormData a objeto JavaScript
    formData.forEach((value, key) => {
        // Manejar arrays como comidas[0][tipoComida]
        if (key.includes('[')) {
            const matches = key.match(/([^\[\]]+)\[(\d+)\]\[([^\[\]]+)\]/);
            if (matches) {
                const arrayName = matches[1];  // comidas
                const index = parseInt(matches[2]);  // 0, 1, 2, etc.
                const prop = matches[3];  // tipoComida, descripcion, etc.
                
                if (!dietaData[arrayName]) {
                    dietaData[arrayName] = [];
                }
                
                if (!dietaData[arrayName][index]) {
                    dietaData[arrayName][index] = {};
                }
                
                dietaData[arrayName][index][prop] = value;
            }
        } else {
            dietaData[key] = value;
        }
    });
    
    // Asegurarse de que comidas sea un array sin huecos
    if (dietaData.comidas) {
        dietaData.comidas = dietaData.comidas.filter(c => c);
    }
    
    console.log('Datos de dieta a enviar:', dietaData);
    
    // Enviar datos al servidor
    fetch('/dietas/crear', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dietaData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Error al crear la dieta');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Dieta creada exitosamente:', data);
        mostrarAlerta('Plan nutricional creado exitosamente', 'success');
        
        // Limpiar formulario
        form.reset();
        const comidasContainer = document.getElementById('comidasContainer');
        // Mantener solo la primera comida (vacía)
        while (comidasContainer.children.length > 1) {
            comidasContainer.removeChild(comidasContainer.lastChild);
        }
        
        // Actualizar tabla de dietas
        actualizarTablaDietas();
    })
    .catch(error => {
        console.error('Error al crear dieta:', error);
        mostrarAlerta('Error al crear dieta: ' + error.message, 'danger');
    });
    
    return false;  // Evitar que el formulario se envíe normalmente
}

// Función para actualizar la tabla de dietas
function actualizarTablaDietas() {
    console.log('Actualizando tabla de dietas...');
    const entrenadorId = document.querySelector('input[name="entrenadorId"]').value;
    
    fetch(`/dietas/entrenador/${entrenadorId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener dietas');
            }
            return response.json();
        })
        .then(dietas => {
            console.log('Dietas obtenidas:', dietas);
            const tableBody = document.getElementById('dietasTableBody');
            
            if (tableBody) {
                // Limpiar tabla
                tableBody.innerHTML = '';
                
                if (dietas && dietas.length > 0) {
                    // Agregar filas para cada dieta
                    dietas.forEach(dieta => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${dieta.nombre}</td>
                            <td>${dieta.descripcion || 'Sin descripción'}</td>
                            <td>${dieta.fechaInicio ? new Date(dieta.fechaInicio).toLocaleDateString() : 'No definida'}</td>
                            <td>${dieta.fechaFin ? new Date(dieta.fechaFin).toLocaleDateString() : 'No definida'}</td>
                            <td>${dieta.comidas ? dieta.comidas.length : 0} comidas</td>
                            <td>
                                <button class="btn btn-sm btn-primary me-2 verDietaBtn" data-dieta-id="${dieta._id}">Ver</button>
                                <button class="btn btn-sm btn-success asignarDietaBtn" data-dieta-id="${dieta._id}">Asignar</button>
                                <button class="btn btn-sm btn-warning editarDietaBtn" data-dieta-id="${dieta._id}">Editar</button>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                    
                    // Agregar event listeners a los nuevos botones
                    agregarEventListeners();
                } else {
                    // Mostrar mensaje si no hay dietas
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center">No hay planes nutricionales disponibles</td>
                        </tr>
                    `;
                }
            } else {
                console.error('No se encontró el elemento dietasTableBody');
            }
        })
        .catch(error => {
            console.error('Error al obtener dietas:', error);
            mostrarAlerta('Error al obtener dietas: ' + error.message, 'danger');
        });
}

// Event listener para confirmar la asignación de dieta
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la página
    console.log('Inicializando dashboard del entrenador...');
    actualizarTablaRutinas();
    actualizarTablaDietas();
    
    // Event listener para agregar comida
    document.getElementById('agregarComida').addEventListener('click', agregarComida);
    
    // Event listener para confirmar asignación de dieta
    document.getElementById('confirmarAsignarDieta').addEventListener('click', function() {
        const dietaId = this.getAttribute('data-dieta-id');
        const clienteId = document.getElementById('clienteParaDieta').value;
        
        if (!clienteId) {
            mostrarAlerta('Debe seleccionar un cliente', 'warning');
            return;
        }
        
        // Enviar la asignación al servidor
        fetch(`/dietas/${dietaId}/asignar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clienteId })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Error al asignar la dieta');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dieta asignada exitosamente:', data);
            mostrarAlerta('Plan nutricional asignado exitosamente', 'success');
            
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('asignarDietaModal'));
            modal.hide();
            
            // Actualizar tabla de dietas
            actualizarTablaDietas();
        })
        .catch(error => {
            console.error('Error al asignar dieta:', error);
            mostrarAlerta('Error al asignar dieta: ' + error.message, 'danger');
        });
    });
});
