export type DocumentTypes = {
    id: string;
    company_id: string;
    environment_id: string;
    name: string;
    code: string;
    description: string | null;
    category: string | null;
    numbering_prefix: string | null;
    next_number: number;
    end_number: number;
    metadata: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type DocumentTypesInsert = Omit<
    DocumentTypes,
    "id" | "company_id" | "environment_id" | "created_at" | "updated_at"
>;
export type DocumentTypesUpdate = Partial<DocumentTypesInsert>;