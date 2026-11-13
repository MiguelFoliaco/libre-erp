import { create } from "zustand";
import type { Language } from "../type";

type LanguageState = {
    language: Language;
    changeLanguage: (language: Language) => void;
};

export const useLanguage = create<LanguageState>(set => ({
    language: 'english',
    changeLanguage: language => set({ language })
}));