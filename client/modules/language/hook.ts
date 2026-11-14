import { create } from "zustand";
import type { Language } from "./type";

type LanguageState = {
    language: Language;
    languages: Language[];
    changeLanguage: (language: Language) => void;
    toggleLanguage: () => void;
};

// CUANDO SE APLIQUE LAS EXTENSION Y PLUGIN SE DEBE RELLANAR ESTO JUNTO CON POSIBLES NUEVAS EXTENSIONES DE TRADUCCION
const languages: Language[] = ['english', 'spanish'];

export const useLanguage = create<LanguageState>((set, get) => ({
    language: 'english',
    languages,
    changeLanguage: language => set({ language }),
    toggleLanguage: () => {
        const { language, languages: l } = get();
        const currentIndex = l.indexOf(language);
        const nextIndex = (currentIndex + 1) % l.length;
        const nextLanguage = l[nextIndex];
        set({ language: nextLanguage });
    }
}));