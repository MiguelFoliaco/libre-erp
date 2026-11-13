import { TranslationSchema } from "./type";

export const spanish = {
    firstScreen: {
        'title': "Bienvenido a ",
        'subtitle': "Sistema implementado por ",
        'label-select-environment': "Selecciona ambiente",
        'btn-continue': "Continuar",
        'text-change-language-1': "Cambiar idioma ",
        "text-change-language-2": "aquí",
        "text-version": "Versión "
    },
    login: {
        title: "Inicia sesión en",
        username: "Usuario",
        password: "Contraseña",
        "sign-in": "Ingresar",
        "forgot-password": "¿Olvidaste tu contraseña?",
        "recover-password": "Recuperar contraseña"
    },
    common: {
        "yes": "Si",
        "no": "No",
        "ok": "Ok",
        "cancel": "Cancelar",
        "loading": "Cargando",
        'back': 'Atrás',
        "error": "Error",
        "success": "Exito",
        'confirm': 'Confirmar',
        'next': 'Siguiente'
    }
} satisfies TranslationSchema;