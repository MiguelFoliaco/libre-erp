import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

export type AppTheme = "lofi" | "lofi-2";

interface ThemeContextValue {
    theme: AppTheme;
    toggleTheme: () => void;
}

const STORAGE_KEY = "libre-erp-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isAppTheme(value: string | null): value is AppTheme {
    return value === "lofi" || value === "lofi-2";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<AppTheme>("lofi");
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const storedTheme = window.localStorage.getItem(STORAGE_KEY);
        if (isAppTheme(storedTheme)) setTheme(storedTheme);
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        if (isInitialized) window.localStorage.setItem(STORAGE_KEY, theme);
    }, [isInitialized, theme]);

    const toggleTheme = useCallback(() => {
        setTheme((current) => current === "lofi" ? "lofi-2" : "lofi");
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme debe usarse dentro de ThemeProvider.");
    return context;
}
