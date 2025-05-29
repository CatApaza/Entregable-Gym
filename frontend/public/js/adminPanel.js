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
    }

    // Asignar eventos de clic a las pestañas
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.getAttribute('data-tab');
            activateTab(tabId);
        });
    });

    // Activar la primera pestaña por defecto
    activateTab('dashboard');
});
