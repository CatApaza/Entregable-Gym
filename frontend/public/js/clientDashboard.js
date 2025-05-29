// Efecto de máquina de escribir para el nombre de usuario
document.addEventListener('DOMContentLoaded', function() {
    const usernameElement = document.querySelector('.username');
    const name = usernameElement.textContent;
    usernameElement.textContent = '';
    
    let i = 0;
    const typingEffect = setInterval(() => {
        if (i < name.length) {
            usernameElement.textContent += name.charAt(i);
            i++;
        } else {
            clearInterval(typingEffect);
        }
    }, 100);
    
    // Efecto hover en tarjetas mejorado
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
    
    // Funcionalidad para calcular IMC
    const calcularImcBtn = document.getElementById('calcular-imc-btn');
    const imcModal = document.getElementById('imc-modal');
    const closeBtn = document.querySelector('.close');
    const calcularBtn = document.getElementById('calcular-btn');
    const pesoInput = document.getElementById('peso');
    const alturaInput = document.getElementById('altura');
    const resultadoImc = document.getElementById('resultado-imc');
    const valorImc = document.getElementById('valor-imc');
    const categoriaImc = document.getElementById('categoria-imc');
    const imcValue = document.getElementById('imc-value');
    
    // Abrir modal al hacer clic en el botón
    calcularImcBtn.addEventListener('click', () => {
        imcModal.style.display = 'block';
        // Pre-llenar con valores predeterminados
        pesoInput.value = '75.4'; // Valor predeterminado de peso
        alturaInput.value = '180'; // Valor predeterminado de altura (cm)
    });
    
    // Cerrar modal al hacer clic en la X
    closeBtn.addEventListener('click', () => {
        imcModal.style.display = 'none';
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (event) => {
        if (event.target === imcModal) {
            imcModal.style.display = 'none';
        }
    });
    
    // Efectos visuales para los inputs
    pesoInput.addEventListener('focus', () => {
        pesoInput.style.borderColor = '#0d6efd';
    });
    
    pesoInput.addEventListener('blur', () => {
        pesoInput.style.borderColor = '#a4b0be';
    });
    
    alturaInput.addEventListener('focus', () => {
        alturaInput.style.borderColor = '#0d6efd';
    });
    
    alturaInput.addEventListener('blur', () => {
        alturaInput.style.borderColor = '#a4b0be';
    });
    
    // Efecto hover para el botón calcular
    calcularBtn.addEventListener('mouseenter', () => {
        calcularBtn.style.transform = 'translateY(-2px)';
        calcularBtn.style.boxShadow = '0 6px 10px rgba(13, 110, 253, 0.3)';
    });
    
    calcularBtn.addEventListener('mouseleave', () => {
        calcularBtn.style.transform = 'translateY(0)';
        calcularBtn.style.boxShadow = '0 4px 6px rgba(13, 110, 253, 0.2)';
    });
    
    // Calcular IMC al hacer clic en el botón Calcular
    calcularBtn.addEventListener('click', () => {
        const peso = parseFloat(pesoInput.value);
        const altura = parseFloat(alturaInput.value);
        
        if (isNaN(peso) || isNaN(altura) || peso <= 0 || altura <= 0) {
            // Mostrar mensaje de error estilizado en lugar de alert
            const errorMsg = document.createElement('div');
            errorMsg.style.color = '#e74c3c';
            errorMsg.style.backgroundColor = '#fceae9';
            errorMsg.style.padding = '10px';
            errorMsg.style.borderRadius = '8px';
            errorMsg.style.marginBottom = '15px';
            errorMsg.style.fontSize = '0.9rem';
            errorMsg.style.textAlign = 'center';
            errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Por favor, ingresa valores válidos para peso y altura.';
            
            // Insertar mensaje de error antes del botón
            calcularBtn.parentNode.insertBefore(errorMsg, calcularBtn);
            
            // Eliminar mensaje después de 3 segundos
            setTimeout(() => {
                errorMsg.remove();
            }, 3000);
            return;
        }
        
        // Efecto de carga
        calcularBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculando...';
        calcularBtn.disabled = true;
        
        setTimeout(() => {
            // Calcular IMC (peso en kg / (altura en m)²)
            const alturaEnMetros = altura / 100;
            const imc = peso / (alturaEnMetros * alturaEnMetros);
            const imcRedondeado = imc.toFixed(1);
            
            // Determinar categoría de IMC y recomendaciones
            let categoria = '';
            let colorFondo = '';
            let recomendacion = '';
            
            if (imc < 18.5) {
                categoria = 'Bajo peso';
                colorFondo = '#3498db'; // Azul
                recomendacion = 'Considera aumentar tu ingesta calórica con alimentos nutritivos.';
            } else if (imc >= 18.5 && imc < 25) {
                categoria = 'Peso normal';
                colorFondo = '#2ecc71'; // Verde
                recomendacion = '¡Excelente! Mantén tus hábitos saludables.';
            } else if (imc >= 25 && imc < 30) {
                categoria = 'Sobrepeso';
                colorFondo = '#f39c12'; // Naranja
                recomendacion = 'Considera incrementar tu actividad física y mejorar tu alimentación.';
            } else {
                categoria = 'Obesidad';
                colorFondo = '#e74c3c'; // Rojo
                recomendacion = 'Recomendamos consultar con un profesional de la salud para un plan personalizado.';
            }
            
            // Mostrar resultado con animación
            resultadoImc.style.display = 'block';
            resultadoImc.style.opacity = '0';
            resultadoImc.style.transform = 'translateY(20px)';
            resultadoImc.style.transition = 'opacity 0.5s, transform 0.5s';
            resultadoImc.style.backgroundColor = colorFondo;
            resultadoImc.style.color = 'white';
            
            // Actualizar contenido
            valorImc.textContent = imcRedondeado;
            categoriaImc.innerHTML = `<strong>Categoría:</strong> ${categoria}<br><small>${recomendacion}</small>`;
            
            // Animar aparición del resultado
            setTimeout(() => {
                resultadoImc.style.opacity = '1';
                resultadoImc.style.transform = 'translateY(0)';
            }, 50);
            
            // Actualizar el valor de IMC en la tarjeta de progreso con animación
            imcValue.style.transition = 'color 0.5s';
            imcValue.style.color = colorFondo;
            imcValue.textContent = imcRedondeado;
            
            // Restaurar el botón
            calcularBtn.innerHTML = 'Calcular mi IMC';
            calcularBtn.disabled = false;
            
            // Volver al color normal después de un tiempo
            setTimeout(() => {
                imcValue.style.color = '';
            }, 2000);
        }, 800); // Simular tiempo de cálculo para mejor UX
    });
});