import { startModule } from "./start-module";

export const english = {
    firstScreen: {
        'title': "Welcome back",
        'subtitle': "This implementation system manager by ",
        'label-select-environment': "Select environment",
        'btn-continue': "Continue",
        'text-change-language-1': "Change language ",
        "text-change-language-2": "here",
        "text-version": "Version ",
        right: {
            title: "Your entire business.",
            title2: "In one place.",
            subtitle: 'Centralize your operations, manage your resources, and stay in control of your business with LibreERP.',
            list: {
                'item-1': 'Centralized Business Management',
                'item-2': 'Multiple companies and environments',
                'item-3': 'Access Control and Permissions'
            }
        }
    },
    login: {
        title: "Sign in to",
        "subtitle": "Enter your login credentials to access your LibreERP workspace.",
        username: "Username or email",
        password: "Password",
        placeholderPassword: "Enter your Password",
        "sign-in": "Sign in",
        "logout": "Logout",
        "forgot-password": "Forgot your password?",
        "recover-password": "Reset password",
        "validating": "Verifying your session...",
        activeSession: "You are already logged in.",
        hello: "Hello",
        bussiness: "Business",
        "env": "Environment",
        "errors": {
            "no-could-session": "No se pudo iniciar sesión. Inténtalo nuevamente.",
            "no-could-logout": "No se pudo cerrar la sesión. Inténtalo nuevamente.",
            "company-not-input": "Ingresa ambos identificadores de empresa y entorno, o deja ambos vacíos."
        }
    },
    common: {
        "yes": "Yes",
        "no": "No",
        "ok": "Ok",
        "cancel": "Cancel",
        "loading": "Loading",
        'back': 'Back',
        "error": "Error",
        "success": "Success",
        'confirm': 'Confirm',
        'next': 'Next',
        "langugage-change": "Change language",
        toast: {
            close: "Close",
            closeNotification: "Close notification"
        },
        leftPanel: {
            workspace: "Workspace",
            returnHome: "Back to home",
            logout: "Sign out"
        },
        welcome: {
            gettingStarted: "Getting started",
            welcomeAboard: "Welcome aboard",
            welcomeTo: "Welcome to",
            exploreDocumentation: "Explore documentation",
            tryThingsOut: "Try things out",
            exploreWhatYouCanDo: "Explore what you can do with {name}.",
            stepsCount: "{count} steps",
            oneStep: "1 step",
            followSteps: "Follow these steps to complete this operation.",
            gettingStartedLabel: "Getting started",
            stepsToFollow: "Steps to follow",
            stepByStepGuide: "Step-by-step guide",
            getStarted: "Get started",
            needMoreInformation: "Need more information?",
            learnMore: "Learn more about the features and capabilities of this module.",
            documentation: "Documentation"
        }
    },
    modules: startModule
} as const