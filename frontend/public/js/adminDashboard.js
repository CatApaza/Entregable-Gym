document.addEventListener('DOMContentLoaded', function() {
    // Manejo de pestañas
    const tabLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-pane');

    // Función para activar una pestaña
    function activateTab(tabId) {
        // Desactivar todas las pestañas
        tabLinks.forEach(link => link.classList.remove('active'));
        tabContents.forEach(content => {
            content.classList.remove('show');
            content.classList.remove('active');
        });

        // Activar la pestaña seleccionada
        const selectedTab = document.getElementById(tabId + '-tab');
        const selectedContent = document.getElementById(tabId + '-content');
        
        if (selectedTab) selectedTab.classList.add('active');
        if (selectedContent) {
            selectedContent.classList.add('show');
            selectedContent.classList.add('active');
        }

        // Si es la pestaña de rutinas, cargar los datos
        if (tabId === 'routines') {
            loadRutinas();
        }
    }

    // Asignar eventos de clic a las pestañas
    document.getElementById('dashboard-tab').addEventListener('click', function(e) {
        e.preventDefault();
        activateTab('dashboard');
    });

    document.getElementById('trainers-tab').addEventListener('click', function(e) {
        e.preventDefault();
        activateTab('trainers');
    });

    document.getElementById('clients-tab').addEventListener('click', function(e) {
        e.preventDefault();
        activateTab('clients');
    });

    document.getElementById('verification-codes-tab').addEventListener('click', function(e) {
        e.preventDefault();
        activateTab('verification-codes');
    });

    // Añadir evento para la pestaña de rutinas
    const routinesLink = document.createElement('li');
    routinesLink.className = 'nav-item';
    routinesLink.innerHTML = `
        <a class="nav-link" href="#" id="routines-tab">
            <i class="fas fa-dumbbell"></i>
            Rutinas
        </a>
    `;
    
    // Insertar después de la pestaña de clientes
    const clientsTab = document.getElementById('clients-tab').parentNode;
    clientsTab.parentNode.insertBefore(routinesLink, clientsTab.nextSibling);

    // Añadir evento de clic a la pestaña de rutinas
    document.getElementById('routines-tab').addEventListener('click', function(e) {
        e.preventDefault();
        activateTab('routines');
    });

    // Función para cargar las rutinas
    function loadRutinas() {
        const rutinasTableBody = document.getElementById('rutinas-table-body');
        rutinasTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando rutinas...</td></tr>';

        fetch('/api/rutinas')
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    let html = '';
                    data.forEach(rutina => {
                        const clienteNombre = rutina.clienteId ? 
                            (rutina.clienteId.usuarioId ? 
                                `${rutina.clienteId.usuarioId.nombre} ${rutina.clienteId.usuarioId.apellido}` : 
                                'N/A') : 
                            'N/A';
                        
                        const entrenadorNombre = rutina.entrenadorId ? 
                            (rutina.entrenadorId.usuarioId ? 
                                `${rutina.entrenadorId.usuarioId.nombre} ${rutina.entrenadorId.usuarioId.apellido}` : 
                                'N/A') : 
                            'N/A';

                        const fechaInicio = rutina.fechaInicio ? new Date(rutina.fechaInicio).toLocaleDateString() : 'No definida';
                        
                        let estadoBadge = '';
                        switch(rutina.estado) {
                            case 'activa':
                                estadoBadge = '<span class="badge badge-custom badge-success">Activa</span>';
                                break;
                            case 'completada':
                                estadoBadge = '<span class="badge badge-custom badge-info">Completada</span>';
                                break;
                            case 'pausada':
                                estadoBadge = '<span class="badge badge-custom badge-warning">Pausada</span>';
                                break;
                            case 'cancelada':
                                estadoBadge = '<span class="badge badge-custom badge-danger">Cancelada</span>';
                                break;
                            default:
                                estadoBadge = '<span class="badge badge-custom badge-secondary">No definido</span>';
                        }

                        html += `
                            <tr>
                                <td>${rutina.nombre || 'Sin nombre'}</td>
                                <td>${clienteNombre}</td>
                                <td>${entrenadorNombre}</td>
                                <td>${rutina.duracionSemanas || 0} semanas</td>
                                <td>${fechaInicio}</td>
                                <td>${estadoBadge}</td>
                                <td>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="verDetallesRutina('${rutina._id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    rutinasTableBody.innerHTML = html;
                } else {
                    rutinasTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay rutinas registradas</td></tr>';
                }
            })
            .catch(error => {
                console.error('Error al cargar rutinas:', error);
                rutinasTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar rutinas</td></tr>';
            });
    }

    // Funciones para manejar acciones en las tablas
    window.verDetallesEntrenador = function(entrenadorId) {
        alert('Ver detalles del entrenador: ' + entrenadorId);
        // Implementar lógica para ver detalles
    };

    window.verificarEntrenador = function(entrenadorId) {
        if (confirm('¿Está seguro de verificar este entrenador?')) {
            const formData = new FormData();
            formData.append('entrenadorId', entrenadorId);
            formData.append('adminId', document.querySelector('input[name="adminId"]').value);

            fetch('/admin/entrenadores/verificar', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                alert('Entrenador verificado correctamente');
                location.reload();
            })
            .catch(error => {
                console.error('Error al verificar entrenador:', error);
                alert('Error al verificar entrenador');
            });
        }
    };

    window.cambiarEstadoUsuario = function(usuarioId, estado) {
        if (confirm(`¿Está seguro de cambiar el estado del usuario a ${estado}?`)) {
            const formData = new FormData();
            formData.append('usuarioId', usuarioId);
            formData.append('estado', estado);

            fetch('/admin/usuarios/estado', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                alert('Estado del usuario actualizado correctamente');
                location.reload();
            })
            .catch(error => {
                console.error('Error al cambiar estado del usuario:', error);
                alert('Error al cambiar estado del usuario');
            });
        }
    };

    window.verDetallesCliente = function(clienteId) {
        alert('Ver detalles del cliente: ' + clienteId);
        // Implementar lógica para ver detalles
    };

    window.verDetallesRutina = function(rutinaId) {
        alert('Ver detalles de la rutina: ' + rutinaId);
        // Implementar lógica para ver detalles
    };
});
