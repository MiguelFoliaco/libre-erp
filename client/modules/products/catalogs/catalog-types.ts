import { apiClient } from "@/lib/sdk";
import { text } from "@/modules/language";

export type CatalogResource = "brands" | "categories" | "departments";
export type CatalogTab = CatalogResource | "tree";

export interface CatalogRecord {
    id: string;
    name: string;
    description: string | null;
    logo_url?: string | null;
    parent_id?: string | null;
    is_active: boolean;
}

export interface CatalogFormValues {
    name: string;
    description: string;
    logoUrl: string;
}

export interface CsvRow {
    name: string;
    description?: string;
    logo_url?: string;
    is_active?: string;
    parent_id?: string;
    metadata?: string;
    rowNumber: number;
}

export const EMPTY_FORM: CatalogFormValues = { name: "", description: "", logoUrl: "" };
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_ROWS = 500;

export function resourceLabel(resource: CatalogResource): string {
    return text(`modules.products.fields.${resource === "brands" ? "brand" : resource === "categories" ? "category" : "department"}`);
}

export function messageFromError(cause: unknown): string {
    return cause instanceof Error ? cause.message : text("modules.products.catalogs.operationFailed");
}

export async function loadAll(resource: CatalogResource): Promise<CatalogRecord[]> {
    const items: CatalogRecord[] = [];
    for (let offset = 0; ; offset += 200) {
        const page = await apiClient.list<CatalogRecord>(resource, { limit: 200, offset });
        items.push(...page.items);
        if (page.items.length < 200) return items;
    }
}

export function parseActive(value: string | undefined): boolean | undefined {
    if (value === undefined || value.trim() === "") return true;
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "si", "sí"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
    return undefined;
}
