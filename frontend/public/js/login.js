// Crear partículas dinámicas
function createParticles() {
    const particlesContainer = document.getElementById('particles-js');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Tamaño aleatorio entre 2px y 6px
        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Posición inicial aleatoria
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.bottom = `-10px`;
        
        // Duración de animación aleatoria entre 10s y 20s
        const duration = Math.random() * 10 + 10;
        particle.style.animationDuration = `${duration}s`;
        
        // Retraso aleatorio para que no todas empiecen juntas
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Efecto 3D al mover el ratón
function setup3DEffect() {
    const container3d = document.querySelector('.container-3d');
    
    document.addEventListener('mousemove', (e) => {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        container3d.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    });
    
    // Resetear cuando el ratón sale
    document.addEventListener('mouseleave', () => {
        container3d.style.transform = 'rotateY(0) rotateX(0)';
    });
}

// Animación de entrada de los campos del formulario
function animateFormElements() {
    $('.form-control').each(function(index) {
        $(this).css('animation-delay', `${index * 0.2 + 0.5}s`);
    });
    
    $('.btn-primary').css('animation-delay', '1.1s');
    $('.link-registro').css('animation-delay', '1.3s');
}

$(document).ready(function() {
    createParticles();
    setup3DEffect();
    animateFormElements();
    
    // Efecto hover mejorado para el contenedor
    $('.login-container').hover(
        function() {
            $(this).css('transform', 'translateZ(50px) rotateY(5deg)');
        },
        function() {
            $(this).css('transform', 'translateZ(30px)');
        }
    );
    
    // Efecto al enfocar los inputs
    $('.form-control').focus(function() {
        $(this).css('transform', 'translateZ(10px)');
    }).blur(function() {
        $(this).css('transform', 'translateZ(0)');
    });
});