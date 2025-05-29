// Configuración del gimnasio
const gimnasioConfig = {
    nombre: "FitLife Gym",
    slogan: "Transforma tu vida, un entrenamiento a la vez",
    descripcion: "En FitLife Gym nos dedicamos a ayudarte a alcanzar tus metas fitness con instalaciones modernas, entrenadores profesionales y un ambiente motivador. Nuestro enfoque personalizado garantiza resultados duraderos.",
    direccion: {
        calle: "Mz Ñ",
        numero: "Lote 6",
        colonia: "Cayma",
        ciudad: "Arequipa",
        estado: "Arequipa",
        codigoPostal: "04000",
        googleMapsUrl: "https://maps.google.com/maps?q=Cayma,Arequipa,Peru&t=&z=15&ie=UTF8&iwloc=&output=embed"
    },
    contacto: {
        telefono: "555-123-4567",
        email: "info@fitlifegym.com",
        whatsapp: "55-1234-5678"
    },
    horarios: {
        lunes: "6:00 AM - 10:00 PM",
        martes: "6:00 AM - 10:00 PM",
        miercoles: "6:00 AM - 10:00 PM",
        jueves: "6:00 AM - 10:00 PM",
        viernes: "6:00 AM - 10:00 PM",
        sabado: "8:00 AM - 8:00 PM",
        domingo: "8:00 AM - 2:00 PM"
    },
    planes: [
        {
            id: 1,
            nombre: "Básico",
            precio: 500,
            duracion: "mensual",
            descripcion: "Acceso a instalaciones básicas",
            caracteristicas: [
                "Acceso a área de pesas",
                "Acceso a cardio",
                "Vestidores"
            ]
        },
        {
            id: 2,
            nombre: "Premium",
            precio: 800,
            duracion: "mensual",
            descripcion: "Acceso completo a todas las instalaciones",
            destacado: true,
            caracteristicas: [
                "Acceso a área de pesas",
                "Acceso a cardio",
                "Clases grupales",
                "Vestidores con lockers",
                "Toallas"
            ]
        },
        {
            id: 3,
            nombre: "VIP",
            precio: 1200,
            duracion: "mensual",
            descripcion: "La experiencia completa con entrenador personal",
            caracteristicas: [
                "Acceso a área de pesas",
                "Acceso a cardio",
                "Clases grupales",
                "Vestidores con lockers",
                "Toallas",
                "2 sesiones semanales con entrenador personal",
                "Evaluación mensual"
            ]
        }
    ],
    redesSociales: {
        facebook: "https://facebook.com/fitlifegym",
        instagram: "https://instagram.com/fitlifegym",
        twitter: "https://twitter.com/fitlifegym"
    }
};

module.exports = gimnasioConfig;
