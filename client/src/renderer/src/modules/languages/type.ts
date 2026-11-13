import { english } from "./english";

export type TranslationSchema<T = typeof english> = {
    [K in keyof T]: T[K] extends string
        ? string
        : TranslationSchema<T[K]>
};

export type PathText<T = typeof english> = {
    [K in keyof T & string]: T[K] extends string
        ? K
        : `${K}.${PathText<T[K]>}`
}[keyof T & string];

export type Language = 'english' | 'spanish';