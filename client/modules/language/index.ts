import { english } from "./english";
import { spanish } from "./spanish";
import { useLanguage } from "./hook";
import type { Language, PathText } from "./type";

const translations = {
    english,
    spanish
};

type TextParams = Record<string, string | number>;

export const text = (path: PathText, params?: TextParams): string => {
    const language = useLanguage.getState().language;

    const translation = path.split('.').reduce<unknown>(
        (obj, key) => {
            if (typeof obj !== 'object' || obj === null) {
                return undefined;
            }

            return (obj as Record<string, unknown>)[key];
        },
        translations[language]
    );

    if (typeof translation !== 'string') {
        return path;
    }

    return translation.replace(
        /\{(\w+)\}/g,
        (match, key: string) => String(params?.[key] ?? match)
    );
};

export { english, spanish };
export type { Language, PathText };