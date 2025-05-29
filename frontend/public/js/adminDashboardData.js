document.addEventListener('DOMContentLoaded', function() {
    // Manejo de pestañas
    const tabLinks = document.querySelectorAll('.admin-sidebar .nav-link');
    
    // Función para activar una pestaña
    function activateTab(tabId) {
        // Desactivar todas las pestañas
        tabLinks.forEach(link => link.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(content => {
            content.classList.remove('show');
            content.classList.remove('active');
        });

        // Activar la pestaña seleccionada
        const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
        const selectedContent = document.getElementById(`${tabId}-content`);
        
        if (selectedTab) selectedTab.classList.add('active');
        if (selectedContent) {
            selectedContent.classList.add('show');
            selectedContent.classList.add('active');
        }

        // Cargar datos según la pestaña seleccionada
        if (tabId === 'trainers') {
            cargarEntrenadores();
        } else if (tabId === 'clients') {
            cargarClientes();
        } else if (tabId === 'routines') {
            cargarRutinas();
        }

        // Guardar la pestaña activa en localStorage para mantenerla después de recargar
        localStorage.setItem('activeAdminTab', tabId);
    }

    // Asignar eventos de clic a las pestañas
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            activateTab(tabId);
        });
    });

    // Recuperar la pestaña activa de localStorage o usar 'dashboard' por defecto
    const activeTab = localStorage.getItem('activeAdminTab') || 'dashboard';
    activateTab(activeTab);

    // Función para cargar entrenadores
    function cargarEntrenadores() {
        const entrenadoresTableBody = document.querySelector('#trainers-content .table tbody');
        if (!entrenadoresTableBody) return;

        entrenadoresTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando entrenadores...</td></tr>';

        fetch('/api/admin/entrenadores')
            .then(response => response.json())
            .then(entrenadores => {
                if (entrenadores && entrenadores.length > 0) {
                    let html = '';
                    entrenadores.forEach(entrenador => {
                        const nombre = entrenador.usuarioId ? 
                            `${entrenador.usuarioId.nombre} ${entrenador.usuarioId.apellido}` : 'N/A';
                        const correo = entrenador.usuarioId ? entrenador.usuarioId.correo : 'N/A';
                        const telefono = entrenador.usuarioId ? entrenador.usuarioId.telefono : 'N/A';
                        const especialidad = entrenador.especialidad || 'No especificada';
                        
                        let estadoBadge = '';
                        if (entrenador.usuarioId && entrenador.usuarioId.estado) {
                            switch(entrenador.usuarioId.estado) {
                                case 'activo':
                                    estadoBadge = '<span class="badge badge-custom badge-success">Activo</span>';
                                    break;
                                case 'pendiente':
                                    estadoBadge = '<span class="badge badge-custom badge-warning">Pendiente</span>';
                                    break;
                                case 'inactivo':
                                    estadoBadge = '<span class="badge badge-custom badge-secondary">Inactivo</span>';
                                    break;
                                case 'bloqueado':
                                    estadoBadge = '<span class="badge badge-custom badge-danger">Bloqueado</span>';
                                    break;
                                default:
                                    estadoBadge = '<span class="badge badge-custom badge-secondary">Desconocido</span>';
                            }
                        } else {
                            estadoBadge = '<span class="badge badge-custom badge-secondary">Desconocido</span>';
                        }

                        html += `
                            <tr>
                                <td>${nombre}</td>
                                <td>${correo}</td>
                                <td>${telefono}</td>
                                <td>${especialidad}</td>
                                <td>${estadoBadge}</td>
                                <td>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="verDetallesEntrenador('${entrenador._id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${entrenador.usuarioId && entrenador.usuarioId.estado === 'pendiente' ? 
                                            `<button class="btn btn-sm btn-outline-success" onclick="verificarEntrenador('${entrenador._id}')">
                                                <i class="fas fa-check"></i>
                                            </button>` : ''}
                                        <button class="btn btn-sm btn-outline-danger" onclick="cambiarEstadoUsuario('${entrenador.usuarioId ? entrenador.usuarioId._id : ''}', 'bloqueado')">
                                            <i class="fas fa-ban"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    entrenadoresTableBody.innerHTML = html;
                } else {
                    entrenadoresTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay entrenadores registrados</td></tr>';
                }
            })
            .catch(error => {
                console.error('Error al cargar entrenadores:', error);
                entrenadoresTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar entrenadores</td></tr>';
            });
    }

    // Función para cargar clientes
    function cargarClientes() {
        const clientesTableBody = document.querySelector('#clients-content .table tbody');
        if (!clientesTableBody) return;

        clientesTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando clientes...</td></tr>';

        fetch('/api/admin/clientes')
            .then(response => response.json())
            .then(clientes => {
                if (clientes && clientes.length > 0) {
                    let html = '';
                    clientes.forEach(cliente => {
                        const nombre = cliente.usuarioId ? 
                            `${cliente.usuarioId.nombre} ${cliente.usuarioId.apellido}` : 'N/A';
                        const correo = cliente.usuarioId ? cliente.usuarioId.correo : 'N/A';
                        const telefono = cliente.usuarioId ? cliente.usuarioId.telefono : 'N/A';
                        const objetivo = cliente.objetivo || 'No especificado';
                        const nivel = cliente.nivel || 'Principiante';
                        
                        let estadoBadge = '';
                        if (cliente.usuarioId && cliente.usuarioId.estado) {
                            switch(cliente.usuarioId.estado) {
                                case 'activo':
                                    estadoBadge = '<span class="badge badge-custom badge-success">Activo</span>';
                                    break;
                                case 'pendiente':
                                    estadoBadge = '<span class="badge badge-custom badge-warning">Pendiente</span>';
                                    break;
                                case 'inactivo':
                                    estadoBadge = '<span class="badge badge-custom badge-secondary">Inactivo</span>';
                                    break;
                                case 'bloqueado':
                                    estadoBadge = '<span class="badge badge-custom badge-danger">Bloqueado</span>';
                                    break;
                                default:
                                    estadoBadge = '<span class="badge badge-custom badge-secondary">Desconocido</span>';
                            }
                        } else {
                            estadoBadge = '<span class="badge badge-custom badge-secondary">Desconocido</span>';
                        }

                        html += `
                            <tr>
                                <td>${nombre}</td>
                                <td>${correo}</td>
                                <td>${telefono}</td>
                                <td>${objetivo}</td>
                                <td>${nivel}</td>
                                <td>${estadoBadge}</td>
                                <td>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="verDetallesCliente('${cliente._id}')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="cambiarEstadoUsuario('${cliente.usuarioId ? cliente.usuarioId._id : ''}', 'bloqueado')">
                                            <i class="fas fa-ban"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    clientesTableBody.innerHTML = html;
                } else {
                    clientesTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay clientes registrados</td></tr>';
                }
            })
            .catch(error => {
                console.error('Error al cargar clientes:', error);
                clientesTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar clientes</td></tr>';
            });
    }

    // Función para cargar rutinas
    function cargarRutinas() {
        const rutinasTableBody = document.querySelector('#routines-content .table tbody');
        if (!rutinasTableBody) return;

        rutinasTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando rutinas...</td></tr>';

        fetch('/api/admin/rutinas')
            .then(response => response.json())
            .then(rutinas => {
                if (rutinas && rutinas.length > 0) {
                    let html = '';
                    rutinas.forEach(rutina => {
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
            formData.append('adminId', document.querySelector('input[name="adminId"]')?.value || '');

            fetch('/admin/entrenadores/verificar', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                alert('Entrenador verificado correctamente');
                cargarEntrenadores();
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
                // Recargar la pestaña actual
                const activeTab = localStorage.getItem('activeAdminTab');
                if (activeTab === 'trainers') {
                    cargarEntrenadores();
                } else if (activeTab === 'clients') {
                    cargarClientes();
                }
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
