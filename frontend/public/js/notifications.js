// Sistema de notificaciones en tiempo real

class NotificationManager {
    constructor(socket, userId) {
        this.socket = socket;
        this.userId = userId;
        this.notifications = [];
        this.unreadCount = 0;
        this.notificationDropdownVisible = false;
        this.initElements();
        this.setupSocketListeners();
        this.setupEventListeners();
    }

    // Inicializar elementos del DOM
    initElements() {
        // Crear el contenedor de notificaciones si no existe
        if (!document.querySelector('.notification-bell')) {
            this.createNotificationElements();
        }

        // Obtener referencias a los elementos
        this.bellIcon = document.querySelector('.notification-bell');
        this.badge = document.querySelector('.notification-badge');
        this.dropdown = document.querySelector('.notification-dropdown');
        this.notificationList = document.querySelector('.notification-list');
        this.clearAllBtn = document.querySelector('.clear-all');
        this.notificationFooter = document.querySelector('.notification-footer');
    }

    // Crear elementos HTML para las notificaciones
    createNotificationElements() {
        const navbarRight = document.querySelector('.navbar-nav') || document.querySelector('.navbar-right');
        
        if (!navbarRight) {
            console.error('No se encontru00f3 el contenedor de la barra de navegaciu00f3n');
            return;
        }

        // Crear el icono de campana con badge
        const bellContainer = document.createElement('div');
        bellContainer.className = 'notification-bell';
        bellContainer.innerHTML = `
            <i class="fas fa-bell"></i>
            <span class="notification-badge">0</span>
            <div class="notification-dropdown">
                <div class="notification-header">
                    <h5>Notificaciones</h5>
                    <span class="clear-all">Marcar todas como leu00eddas</span>
                </div>
                <ul class="notification-list"></ul>
                <div class="notification-footer">
                    <a href="#">Ver todas las notificaciones</a>
                </div>
            </div>
        `;

        // Insertar antes del primer elemento en la barra de navegaciu00f3n
        navbarRight.insertBefore(bellContainer, navbarRight.firstChild);

        // Agregar estilos si no estu00e1n ya incluidos
        if (!document.querySelector('link[href*="notifications.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/css/notifications.css';
            document.head.appendChild(link);
        }
    }

    // Configurar listeners de Socket.IO
    setupSocketListeners() {
        console.log('Configurando listeners de Socket.IO para el usuario:', this.userId);
        
        // Solicitar notificaciones al conectar
        this.socket.emit('get-notifications', { userId: this.userId });
        console.log('Solicitando notificaciones para el usuario:', this.userId);

        // Recibir todas las notificaciones
        this.socket.on(`all-notifications-${this.userId}`, (notifications) => {
            console.log('Notificaciones recibidas:', notifications);
            this.notifications = notifications;
            this.renderNotifications();
            
            // Contar notificaciones no leu00eddas
            const unreadCount = notifications.filter(notification => !notification.read).length;
            this.unreadCount = unreadCount;
            this.updateBadge();
            
            // Actualizar el badge de chat
            this.updateChatBadge(unreadCount);
        });

        // Recibir contador de no leu00eddas
        this.socket.on(`unread-count-${this.userId}`, (data) => {
            console.log('Contador de notificaciones no leu00eddas recibido:', data);
            this.unreadCount = data.count;
            this.updateBadge();
            
            // Actualizar el badge de chat
            this.updateChatBadge(data.count);
        });

        // Recibir nueva notificaciu00f3n
        this.socket.on(`notifications-${this.userId}`, (notification) => {
            console.log('Nueva notificaciu00f3n recibida:', notification);
            this.notifications.unshift(notification);
            this.unreadCount++;
            this.updateBadge();
            this.renderNotifications();
            this.showNotificationToast(notification);
            
            // Actualizar el badge de chat
            this.updateChatBadge(this.unreadCount);
        });
    }

    // Configurar event listeners
    setupEventListeners() {
        // Toggle dropdown al hacer clic en la campana
        this.bellIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotificationDropdown();
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (this.notificationDropdownVisible && !this.dropdown.contains(e.target) && e.target !== this.bellIcon) {
                this.hideNotificationDropdown();
            }
        });

        // Marcar todas como leu00eddas
        this.clearAllBtn.addEventListener('click', () => {
            const unreadNotifications = this.notifications.filter(n => !n.read).map(n => n.id);
            if (unreadNotifications.length > 0) {
                this.socket.emit('mark-notifications-read', {
                    userId: this.userId,
                    notificationIds: unreadNotifications
                });
            }
        });
    }

    // Mostrar/ocultar dropdown de notificaciones
    toggleNotificationDropdown() {
        if (this.notificationDropdownVisible) {
            this.hideNotificationDropdown();
        } else {
            this.showNotificationDropdown();
        }
    }

    // Mostrar dropdown de notificaciones
    showNotificationDropdown() {
        this.dropdown.classList.add('show');
        this.notificationDropdownVisible = true;

        // Marcar notificaciones como leu00eddas al abrir el dropdown
        const unreadNotifications = this.notifications.filter(n => !n.read).map(n => n.id);
        if (unreadNotifications.length > 0) {
            this.socket.emit('mark-notifications-read', {
                userId: this.userId,
                notificationIds: unreadNotifications
            });
        }
    }

    // Ocultar dropdown de notificaciones
    hideNotificationDropdown() {
        this.dropdown.classList.remove('show');
        this.notificationDropdownVisible = false;
    }

    // Actualizar badge con contador de no leu00eddas
    updateBadge() {
        if (this.badge) {
            if (this.unreadCount > 0) {
                this.badge.textContent = this.unreadCount;
                this.badge.style.display = 'block';
            } else {
                this.badge.style.display = 'none';
            }
        }
    }
    
    // Actualizar el badge de chat con el contador de mensajes no leu00eddos
    updateChatBadge(count) {
        const chatBadge = document.getElementById('chat-notification-badge');
        if (chatBadge) {
            // Siempre actualizar el texto del contador
            chatBadge.textContent = count;
            
            if (count > 0) {
                // Asegurar que el badge sea visible
                chatBadge.style.display = 'inline-flex';
                
                // Aplicar animaciu00f3n para llamar la atenciu00f3n
                chatBadge.classList.add('notification-new');
                
                // Hacer que el badge sea mu00e1s visible
                chatBadge.style.backgroundColor = '#ff3636';
                chatBadge.style.color = 'white';
                chatBadge.style.fontWeight = 'bold';
                
                // Quitar la animaciu00f3n despuu00e9s de un momento
                setTimeout(() => {
                    chatBadge.classList.remove('notification-new');
                }, 1000);
            } else {
                // Si no hay mensajes, mostrar 0 pero con estilo menos llamativo
                chatBadge.style.backgroundColor = '#6c757d';
                chatBadge.style.opacity = '0.7';
            }
        }
    }

    // Renderizar lista de notificaciones
    renderNotifications() {
        if (!this.notificationList) return;

        if (this.notifications.length === 0) {
            this.notificationList.innerHTML = `
                <div class="notification-empty">
                    No tienes notificaciones
                </div>
            `;
            return;
        }

        this.notificationList.innerHTML = '';

        // Ordenar notificaciones por fecha (mu00e1s recientes primero)
        const sortedNotifications = [...this.notifications].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        sortedNotifications.forEach(notification => {
            const notificationItem = document.createElement('li');
            notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
            notificationItem.dataset.id = notification.id;

            // Formatear fecha
            const date = new Date(notification.timestamp);
            const formattedDate = this.formatDate(date);

            notificationItem.innerHTML = `
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <span class="notification-time">${formattedDate}</span>
                <div class="notification-actions">
                    <a href="${notification.chatUrl}" class="view-notification">Ver chat</a>
                    <span class="delete-notification" data-id="${notification.id}">Eliminar</span>
                </div>
            `;

            this.notificationList.appendChild(notificationItem);

            // Evento para eliminar notificaciu00f3n
            const deleteBtn = notificationItem.querySelector('.delete-notification');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const notificationId = parseInt(e.target.dataset.id);
                this.socket.emit('remove-notifications', {
                    userId: this.userId,
                    notificationIds: [notificationId]
                });
            });
        });
    }

    // Formatear fecha para mostrar
    formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) {
            return 'Ahora mismo';
        } else if (diffMins < 60) {
            return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
        } else if (diffHours < 24) {
            return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        } else if (diffDays < 7) {
            return `Hace ${diffDays} ${diffDays === 1 ? 'du00eda' : 'du00edas'}`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    }

    // Mostrar toast para nueva notificaciu00f3n
    showNotificationToast(notification) {
        // Verificar si existe la funciu00f3n de toasts de Bootstrap
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            // Crear elemento toast si no existe
            let toastContainer = document.querySelector('.toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
                document.body.appendChild(toastContainer);
            }

            const toastId = `toast-${Date.now()}`;
            const toastEl = document.createElement('div');
            toastEl.className = 'toast';
            toastEl.id = toastId;
            toastEl.setAttribute('role', 'alert');
            toastEl.setAttribute('aria-live', 'assertive');
            toastEl.setAttribute('aria-atomic', 'true');

            toastEl.innerHTML = `
                <div class="toast-header">
                    <strong class="me-auto">${notification.title}</strong>
                    <small>${this.formatDate(new Date(notification.timestamp))}</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${notification.message}
                    <div class="mt-2 pt-2 border-top">
                        <a href="${notification.chatUrl}" class="btn btn-primary btn-sm">Ver chat</a>
                    </div>
                </div>
            `;

            toastContainer.appendChild(toastEl);

            const toast = new bootstrap.Toast(toastEl);
            toast.show();

            // Eliminar toast despuu00e9s de ocultarse
            toastEl.addEventListener('hidden.bs.toast', () => {
                toastEl.remove();
            });
        } else {
            // Fallback si no estu00e1 disponible Bootstrap
            console.log('Nueva notificaciu00f3n:', notification.message);
        }
    }
}

// Inicializar el sistema de notificaciones cuando el DOM estu00e9 listo
document.addEventListener('DOMContentLoaded', () => {
    // Comprobar si existe socket.io y el usuario estu00e1 autenticado
    if (typeof io !== 'undefined' && window.userId) {
        // Conectar a socket.io
        const socket = io();
        
        // Inicializar el gestor de notificaciones
        const notificationManager = new NotificationManager(socket, window.userId);
    }
});
