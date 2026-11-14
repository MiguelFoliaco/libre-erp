import type { TranslationSchema } from "../type";
import { startModule } from "./start-module";

export const spanish = {
    firstScreen: {
        'title': "Bienvenido a ",
        'subtitle': "Sistema implementado por ",
        'label-select-environment': "Selecciona ambiente",
        'btn-continue': "Continuar",
        'text-change-language-1': "Cambiar idioma ",
        "text-change-language-2": "aquí",
        "text-version": "Versión ",
        right: {
            title: "Todo tu negocio.",
            title2: "En un solo lugar.",
            subtitle: 'Centraliza tus operaciones, administra tus recursos y mantén el control de tu empresa con LibreERP.',
            list: {
                'item-1': 'Gestión empresarial centralizada',
                'item-2': 'Múltiples empresas y entornos',
                'item-3': 'Control de acceso y permisos'
            }
        }
    },
    login: {
        title: "Inicia sesión en",
        "subtitle": "Ingresa tus credenciales para acceder a tu espacio de trabajo en LibreERP.",
        username: "Usuario o correo",
        password: "Contraseña",
        "logout": "Cerrar sesión",
        placeholderPassword: "Ingresa tu Contraseña",
        "sign-in": "Ingresar",
        "forgot-password": "¿Olvidaste tu contraseña?",
        "recover-password": "Recuperar contraseña",
        "validating": "Validando tu sesión...",
        activeSession: "Sesión activa",
        hello: "Hola",
        bussiness: "Empresa",
        "env": "Ambiente",
        "errors": {
            "no-could-session": "No se pudo iniciar sesión. Inténtalo nuevamente.",
            "no-could-logout": "No se pudo cerrar la sesión. Inténtalo nuevamente.",
            "company-not-input": "Ingresa ambos identificadores de empresa y entorno, o deja ambos vacíos."
        }
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
    },
    startModule
} satisfies TranslationSchema;