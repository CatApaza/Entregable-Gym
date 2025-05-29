/**
 * Sistema de Alertas del Chat para Dashboard de Administrador
 */

// Función para cargar las alertas en el dashboard
function cargarAlertasChat() {
    console.log('Ejecutando cargarAlertasChat() desde chatAlertas.js');
    
    // Preparar el contenedor de alertas
    prepararContenedorAlertas();
    
    // Actualizar las alertas inmediatamente y luego cada 10 segundos
    actualizarAlertas();
    setInterval(actualizarAlertas, 10000);
}

// Función para preparar el contenedor de alertas
function prepararContenedorAlertas() {
    console.log('Preparando contenedor de alertas');
    // Verificar si estamos en el dashboard del administrador
    const dashboardContent = document.getElementById('dashboard-content');
    if (!dashboardContent) {
        console.log('No estamos en el dashboard del administrador');
        return;
    }
    
    // Si ya existe el panel, no hacer nada
    if (document.getElementById('panel-alertas-chat')) {
        console.log('El panel de alertas ya existe');
        return;
    }
    
    // Crear el panel de alertas
    const panelAlertas = document.createElement('div');
    panelAlertas.id = 'panel-alertas-chat';
    panelAlertas.className = 'card mt-4';
    panelAlertas.innerHTML = `
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Alertas del Chat</h5>
            <button id="refresh-alerts" class="btn btn-sm btn-light">
                <i class="fas fa-sync"></i> Actualizar
            </button>
        </div>
        <div class="card-body">
            <div id="alertas-chat-container" class="alert-list">
                <p class="text-center text-muted">Cargando alertas...</p>
            </div>
        </div>
    `;
    
    // Insertar el panel al principio del dashboard
    dashboardContent.insertBefore(panelAlertas, dashboardContent.firstChild);
    
    // Agregar evento al botón de actualizar
    document.getElementById('refresh-alerts').addEventListener('click', function() {
        actualizarAlertas();
    });
    
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
            transition: all 0.3s ease;
        }
        .alerta-atendida {
            opacity: 0.8;
            border-left: 5px solid #198754 !important;
            background-color: rgba(25, 135, 84, 0.1) !important;
        }
        .alert-danger.alerta-atendida {
            background-color: rgba(220, 53, 69, 0.1) !important;
        }
        .alert-warning.alerta-atendida {
            background-color: rgba(255, 193, 7, 0.1) !important;
        }
        .alert-success.alerta-atendida {
            background-color: rgba(25, 135, 84, 0.1) !important;
        }
        .btn-atender, .btn-no-atender {
            white-space: nowrap;
            transition: all 0.2s ease;
        }
        .btn-atender:hover {
            background-color: #0d6efd;
            color: white;
        }
        .btn-no-atender:hover {
            background-color: #6c757d;
            color: white;
        }
    `;
    document.head.appendChild(style);
}

// Función para actualizar las alertas
function actualizarAlertas() {
    console.log('Actualizando alertas...');
    const alertasContainer = document.getElementById('alertas-chat-container');
    if (!alertasContainer) {
        console.log('No se encontró el contenedor de alertas');
        return;
    }
    
    // Mostrar indicador de carga
    alertasContainer.innerHTML = '<p class="text-center text-muted">Actualizando alertas...</p>';
    
    // Obtener alertas del servidor con un timestamp para evitar la caché
    fetch('/api/admin/alertas-chat?t=' + new Date().getTime())
        .then(response => {
            console.log('Respuesta del servidor:', response.status);
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);
            if (data.alertas && data.alertas.length > 0) {
                mostrarAlertas(data.alertas);
            } else {
                alertasContainer.innerHTML = '<p class="text-center text-muted">No hay alertas recientes del chat</p>';
            }
        })
        .catch(error => {
            console.error('Error al obtener alertas:', error);
            alertasContainer.innerHTML = `<p class="text-center text-danger">Error al obtener alertas: ${error.message}</p>`;
        });
}

// Función para mostrar las alertas
function mostrarAlertas(alertas) {
    const alertasContainer = document.getElementById('alertas-chat-container');
    let html = '';
    
    alertas.forEach(alerta => {
        const colorClass = alerta.color === 'rojo' ? 'danger' : 
                        alerta.color === 'amarillo' ? 'warning' : 'success';
        
        // Determinar si la alerta está atendida
        const atendidaClass = alerta.atendida ? 'alerta-atendida' : '';
        const botonAtender = alerta.atendida ? 
            `<button class="btn btn-sm btn-outline-secondary btn-no-atender" data-id="${alerta._id}">Marcar como no atendida</button>` : 
            `<button class="btn btn-sm btn-primary btn-atender" data-id="${alerta._id}">Marcar como atendida</button>`;
        
        html += `
            <div class="alert alert-${colorClass} d-flex align-items-center ${atendidaClass}" id="alerta-${alerta._id}">
                <div style="margin-right: 15px; font-size: 24px;">${alerta.emojiInteres || ''}</div>
                <div class="flex-grow-1">
                    <strong>${alerta.nombreUsuario || 'Cliente'}</strong> 
                    <span class="text-muted">(${alerta.hora || 'Ahora'})</span>
                    ${alerta.atendida ? '<span class="badge bg-success ms-2">Atendida</span>' : ''}
                    <br>
                    <small>${alerta.mensaje || 'Sin mensaje'}</small>
                </div>
                <div class="ms-auto">
                    ${botonAtender}
                </div>
            </div>
        `;
    });
    
    alertasContainer.innerHTML = html;
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-atender').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const alertaId = e.target.getAttribute('data-id');
            marcarAlertaComoAtendida(alertaId, true);
        });
    });
    
    document.querySelectorAll('.btn-no-atender').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const alertaId = e.target.getAttribute('data-id');
            marcarAlertaComoAtendida(alertaId, false);
        });
    });
}

// Función para marcar una alerta como atendida o no atendida
function marcarAlertaComoAtendida(alertaId, atendida) {
    if (!alertaId) return;
    
    console.log(`Marcando alerta ${alertaId} como ${atendida ? 'atendida' : 'no atendida'}...`);
    
    fetch(`/api/admin/alertas/${alertaId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ atendida })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al actualizar la alerta');
        }
        return response.json();
    })
    .then(data => {
        console.log('Alerta actualizada:', data);
        // Actualizar la UI sin recargar todas las alertas
        const alertaElement = document.getElementById(`alerta-${alertaId}`);
        if (alertaElement) {
            if (atendida) {
                alertaElement.classList.add('alerta-atendida');
                alertaElement.querySelector('.ms-auto').innerHTML = 
                    `<button class="btn btn-sm btn-outline-secondary btn-no-atender" data-id="${alertaId}">Marcar como no atendida</button>`;
                
                // Agregar el badge de atendida
                const infoDiv = alertaElement.querySelector('.flex-grow-1');
                const badge = document.createElement('span');
                badge.className = 'badge bg-success ms-2';
                badge.textContent = 'Atendida';
                
                // Insertarlo después del span con la hora
                const horaSpan = infoDiv.querySelector('.text-muted');
                if (horaSpan && !infoDiv.querySelector('.badge')) {
                    horaSpan.insertAdjacentElement('afterend', badge);
                }
            } else {
                alertaElement.classList.remove('alerta-atendida');
                alertaElement.querySelector('.ms-auto').innerHTML = 
                    `<button class="btn btn-sm btn-primary btn-atender" data-id="${alertaId}">Marcar como atendida</button>`;
                
                // Quitar el badge de atendida si existe
                const badge = alertaElement.querySelector('.badge');
                if (badge) badge.remove();
            }
            
            // Volver a agregar event listeners
            if (atendida) {
                alertaElement.querySelector('.btn-no-atender').addEventListener('click', (e) => {
                    marcarAlertaComoAtendida(alertaId, false);
                });
            } else {
                alertaElement.querySelector('.btn-atender').addEventListener('click', (e) => {
                    marcarAlertaComoAtendida(alertaId, true);
                });
            }
        }
    })
    .catch(error => {
        console.error('Error al marcar la alerta:', error);
        alert('No se pudo actualizar el estado de la alerta. Por favor, inténtalo de nuevo.');
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página del administrador
    if (window.location.pathname.includes('/admin')) {
        console.log('Página de administrador detectada, iniciando sistema de alertas');
        cargarAlertasChat();
    }
});
