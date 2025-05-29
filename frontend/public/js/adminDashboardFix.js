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
        } else if (tabId === 'dashboard') {
            cargarAlertasChat();
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
    
    // Cargar alertas del chat si estamos en el dashboard
    if (activeTab === 'dashboard') {
        cargarAlertasChat();
    }

    // Función para formatear fechas
    function formatDate(dateString) {
        if (!dateString) return 'No definida';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Función para crear badges de estado
    function getStatusBadge(status) {
        let badgeClass = '';
        let text = status;
        
        switch(status) {
            case 'activo':
                badgeClass = 'badge-success';
                text = 'Activo';
                break;
            case 'pendiente':
                badgeClass = 'badge-warning';
                text = 'Pendiente';
                break;
            case 'inactivo':
                badgeClass = 'badge-secondary';
                text = 'Inactivo';
                break;
            case 'bloqueado':
                badgeClass = 'badge-danger';
                text = 'Bloqueado';
                break;
            default:
                badgeClass = 'badge-secondary';
                text = status || 'Desconocido';
        }
        
        return `<span class="badge badge-custom ${badgeClass}">${text}</span>`;
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
                            estadoBadge = getStatusBadge(entrenador.usuarioId.estado);
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
                            estadoBadge = getStatusBadge(cliente.usuarioId.estado);
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

                        const fechaInicio = formatDate(rutina.fechaInicio);
                        
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
    
    // Función para cargar y mostrar las alertas del chat en el dashboard
    function cargarAlertasChat() {
        console.log('Cargando alertas del chat...');
        const alertasContainer = document.getElementById('alertas-chat-container');
        
        if (!alertasContainer) {
            console.log('Creando contenedor de alertas del chat...');
            // Si no existe el contenedor, lo creamos
            const dashboardContent = document.getElementById('dashboard-content');
            if (dashboardContent) {
                // Verificar si ya existe el panel de alertas
                if (!document.getElementById('panel-alertas-chat')) {
                    // Crear el panel de alertas
                    const panelAlertas = document.createElement('div');
                    panelAlertas.id = 'panel-alertas-chat';
                    panelAlertas.className = 'card';
                    panelAlertas.innerHTML = `
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">Alertas del Chat</h5>
                        </div>
                        <div class="card-body">
                            <div id="alertas-chat-container" class="alert-list">
                                <p class="text-center text-muted">Cargando alertas...</p>
                            </div>
                        </div>
                    `;
                    
                    // Insertar el panel después del primer elemento hijo del dashboard
                    const firstChild = dashboardContent.firstChild;
                    if (firstChild) {
                        dashboardContent.insertBefore(panelAlertas, firstChild.nextSibling);
                    } else {
                        dashboardContent.appendChild(panelAlertas);
                    }
                }
            }
        }
        
        // Cargar las alertas del servidor
        fetch('/api/admin/alertas')
            .then(response => response.json())
            .then(data => {
                const alertasContainer = document.getElementById('alertas-chat-container');
                if (alertasContainer) {
                    if (data.alertas && data.alertas.length > 0) {
                        let html = '<div class="alert-list">';
                        data.alertas.forEach(alerta => {
                            const colorClass = alerta.color === 'rojo' ? 'danger' : 
                                            alerta.color === 'amarillo' ? 'warning' : 'success';
                            
                            html += `
                                <div class="alert alert-${colorClass} d-flex align-items-center">
                                    <div class="me-3">${alerta.emojiInteres}</div>
                                    <div>
                                        <strong>${alerta.nombreUsuario}</strong> (${alerta.hora})<br>
                                        <small>${alerta.mensaje}</small>
                                    </div>
                                </div>
                            `;
                        });
                        html += '</div>';
                        alertasContainer.innerHTML = html;
                    } else {
                        alertasContainer.innerHTML = '<p class="text-center text-muted">No hay alertas recientes del chat</p>';
                    }
                }
            })
            .catch(error => {
                console.error('Error al cargar alertas del chat:', error);
                const alertasContainer = document.getElementById('alertas-chat-container');
                if (alertasContainer) {
                    alertasContainer.innerHTML = '<p class="text-center text-danger">Error al cargar alertas</p>';
                }
            });
    }
    
    // Manejar el botón de cierre de sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                window.location.href = '/logout';
            }
        });
    }
    
    // Agregar estilos CSS para las alertas
    const style = document.createElement('style');
    style.textContent = `
        .alert-list {
            max-height: 300px;
            overflow-y: auto;
        }
        .alert-list .alert {
            margin-bottom: 10px;
            padding: 10px 15px;
            border-radius: 5px;
        }
    `;
    document.head.appendChild(style);
});