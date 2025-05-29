
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    form.addEventListener('submit', (event) => {
        // Aquí puedes agregar lógica antes de enviar el formulario, si es necesario.
        console.log("Formulario enviado");
    });
});
