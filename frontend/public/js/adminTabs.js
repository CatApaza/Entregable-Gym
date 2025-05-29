// Función para activar una pestaña
function activateTab(tabId) {
    // Obtener todas las pestañas y contenidos
    const tabLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-pane');
    
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
}

// Cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Asignar eventos de clic a las pestañas
    const dashboardTab = document.getElementById('dashboard-tab');
    const trainersTab = document.getElementById('trainers-tab');
    const clientsTab = document.getElementById('clients-tab');
    const verificationCodesTab = document.getElementById('verification-codes-tab');
    
    if (dashboardTab) {
        dashboardTab.addEventListener('click', function(e) {
            e.preventDefault();
            activateTab('dashboard');
        });
    }
    
    if (trainersTab) {
        trainersTab.addEventListener('click', function(e) {
            e.preventDefault();
            activateTab('trainers');
        });
    }
    
    if (clientsTab) {
        clientsTab.addEventListener('click', function(e) {
            e.preventDefault();
            activateTab('clients');
        });
    }
    
    if (verificationCodesTab) {
        verificationCodesTab.addEventListener('click', function(e) {
            e.preventDefault();
            activateTab('verification-codes');
        });
    }
});
