# Electron + React + TypeScript App

Plantilla base moderna y optimizada para crear aplicaciones de escritorio con **Electron**, **React 18** y **TypeScript**, impulsada por **electron-vite**.

## 🚀 Características

- ⚡ **electron-vite**: Compilación ultra rápida basada en Vite y recarga en caliente (HMR) tanto para el proceso renderer como para el main y preload.
- ⚛️ **React 18**: UI reactiva y moderna.
- 🎨 **Tailwind CSS + DaisyUI**: Clases utilitarias y componentes para la interfaz del renderer.
- 🛡️ **TypeScript Estricto**: Configuración de TS separada para Node (proceso principal y preload) y Web (proceso renderer).
- 🔒 **Seguridad por defecto**: `contextIsolation` activado, `nodeIntegration` desactivado y paso seguro de APIs mediante `contextBridge`.
- 📡 **IPC tipado**: Ejemplo funcional de comunicación bidireccional entre Renderer y Main.

## 📂 Estructura del Proyecto

```
electron-react-ts/
├── electron.vite.config.ts    # Configuración de compilación Vite para Electron
├── postcss.config.cjs         # Procesamiento de Tailwind CSS y Autoprefixer
├── tailwind.config.cjs        # Rutas del renderer y plugin de DaisyUI
├── tsconfig.json              # Referencias maestras de TypeScript
├── tsconfig.node.json         # Tipado y reglas para Node/Electron (main & preload)
├── tsconfig.web.json          # Tipado y reglas para React / Browser (renderer)
├── package.json
└── src/
    ├── main/                  # Proceso principal de Electron
    │   └── index.ts           # Creación de ventana y manejadores IPC
    ├── preload/               # Script Preload (puente seguro)
    │   ├── index.ts           # Exposición de APIs mediante contextBridge
    │   └── index.d.ts         # Declaraciones de tipos para window.api
    └── renderer/              # Proceso Renderer (UI de React)
        ├── index.html         # Archivo HTML de entrada
        └── src/
            ├── App.tsx        # Componente principal con estado e IPC
            ├── main.tsx       # Punto de entrada de React
            └── assets/
                └── index.css  # Tailwind CSS y estilos globales
```

Tailwind y DaisyUI se compilan dentro del renderer junto con la aplicación. Puedes usar sus clases en los componentes React, por ejemplo `className="btn btn-primary"`. DaisyUI incluye los temas `light` y `dark`; cambia el tema con `data-theme="dark"` en un elemento de la interfaz.

## 🛠️ Comandos Disponibles

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar en modo desarrollo
Inicia el entorno de desarrollo con recarga en caliente (HMR):
```bash
npm run dev
```

### 3. Verificar tipos TypeScript
```bash
npm run typecheck
```

### 4. Compilar para producción
Genera los paquetes optimizados en el directorio `out/`:
```bash
npm run build
```
