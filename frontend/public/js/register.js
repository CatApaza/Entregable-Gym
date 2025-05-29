// Mostrar/ocultar campos según tipo de usuario
$(document).ready(function() {
    $('#tipoUsuario').change(function() {
        const selected = $(this).val();
        
        // Ocultar todas las secciones de tipo de usuario
        $('.user-type-section').hide();
        
        // Reiniciar validaciones
        $('#codigoVerificacion').prop('required', false);
        
        if (selected === 'cliente') {
            $('#camposCliente').show();
            // Hacer que los campos específicos de cliente sean requeridos si es necesario
            $('#objetivo, #nivel').prop('required', true);
        } else if (selected === 'entrenador') {
            $('#camposEntrenador').show();
            // Hacer que el código de verificación sea requerido para entrenadores
            $('#codigoVerificacion').prop('required', true);
        }
    });
    
    // Navegación entre pestañas
    $('.next-btn').click(function() {
        const nextTab = $(this).data('next');
        $(`#${nextTab}-tab`).tab('show');
        
        // Validar campos antes de avanzar
        if (nextTab === 'type') {
            const currentTab = $(this).closest('.tab-pane');
            let isValid = true;
            
            currentTab.find('[required]').each(function() {
                if (!$(this).val()) {
                    isValid = false;
                    $(this).addClass('is-invalid');
                } else {
                    $(this).removeClass('is-invalid');
                }
            });
            
            if (!isValid) {
                alert('Por favor complete todos los campos requeridos');
                return false;
            }
        }
    });
    
    $('.prev-btn').click(function() {
        const prevTab = $(this).data('prev');
        $(`#${prevTab}-tab`).tab('show');
    });
});

// Alternar visibilidad de contraseña
function togglePassword(id) {
    const input = document.getElementById(id);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Validación en tiempo real
$(document).on('input', '[required]', function() {
    if ($(this).val()) {
        $(this).removeClass('is-invalid');
    } else {
        $(this).addClass('is-invalid');
    }
});

// Validar formulario antes de enviar
$('#registrationForm').on('submit', function(e) {
    e.preventDefault(); // Prevenir el envío del formulario por defecto
    
    const tipoUsuario = $('#tipoUsuario').val();
    let isValid = true;
    let errorMessage = '';
    
    // Limpiar mensajes de error previos
    $('.is-invalid').removeClass('is-invalid');
    
    // Validar campos obligatorios generales
    const camposObligatorios = ['nombre', 'apellido', 'correo', 'contrasenia', 'telefono', 'fechaNacimiento'];
    camposObligatorios.forEach(campo => {
        const $campo = $(`#${campo}`);
        if (!$campo.val()) {
            $campo.addClass('is-invalid');
            isValid = false;
            errorMessage = 'Por favor complete todos los campos obligatorios';
        }
    });
    
    // Validar género
    if (!$('input[name="genero"]:checked').length) {
        $('input[name="genero"]').addClass('is-invalid');
        isValid = false;
        errorMessage = 'Por favor seleccione un género';
    }
    
    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if ($('#correo').val() && !emailRegex.test($('#correo').val())) {
        $('#correo').addClass('is-invalid');
        isValid = false;
        errorMessage = 'Por favor ingrese un correo electrónico válido';
    }
    
    // Validar contraseña (mínimo 6 caracteres)
    if ($('#contrasenia').val() && $('#contrasenia').val().length < 6) {
        $('#contrasenia').addClass('is-invalid');
        isValid = false;
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    // Validar tipo de usuario
    if (!tipoUsuario) {
        $('#tipoUsuario').addClass('is-invalid');
        isValid = false;
        errorMessage = 'Por favor seleccione un tipo de usuario';
    }
    
    // Validaciones específicas según tipo de usuario
    if (tipoUsuario === 'cliente') {
        // Validar campos específicos de cliente
        if (!$('#objetivo').val()) {
            $('#objetivo').addClass('is-invalid');
            isValid = false;
            errorMessage = 'Por favor seleccione un objetivo fitness';
        }
        if (!$('#nivel').val()) {
            $('#nivel').addClass('is-invalid');
            isValid = false;
            errorMessage = 'Por favor seleccione su nivel actual';
        }
    } else if (tipoUsuario === 'entrenador') {
        // Validar código de verificación para entrenadores
        if (!$('#codigoVerificacion').val()) {
            $('#codigoVerificacion').addClass('is-invalid');
            isValid = false;
            errorMessage = 'El código de verificación es obligatorio para entrenadores';
        }
    }
    
    if (!isValid) {
        // Mostrar mensaje de error
        if (errorMessage) {
            // Crear un div de alerta si no existe
            if ($('.alert-danger').length === 0) {
                const alertDiv = `<div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <strong>Error:</strong> ${errorMessage}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`;
                $(this).before(alertDiv);
            } else {
                // Actualizar mensaje existente
                $('.alert-danger strong').next().text(` ${errorMessage}`);
            }
        }
        return false;
    }
    
    // Si todo está bien, enviar el formulario
    console.log('Formulario válido, enviando datos...');
    this.submit();
});