import { useCallback, useEffect, useState } from "react";
import type { DocumentTypes } from "@/lib/document";
import { ApiError, apiClient } from "@/lib/sdk";
import { useToast } from "@/modules/common/toast";

export type DocumentFieldDataType =
    | "text"
    | "number"
    | "decimal"
    | "date"
    | "datetime"
    | "boolean"
    | "currency"
    | "select"
    | "textarea"
    | "json";

export interface DocumentTypeField {
    id: string;
    document_type_id: string;
    name: string;
    label: string;
    data_type: DocumentFieldDataType;
    is_required: boolean;
    is_currency: boolean;
    position: number;
    options: Record<string, unknown>;
}

interface DocumentTypeZoneRecord {
    id: string;
    document_type_id: string;
    title: string;
    field_name: string | null;
    position: number;
    metadata: Record<string, unknown>;
}

export interface DocumentFieldDraft {
    name: string;
    label: string;
    data_type: DocumentFieldDataType;
    is_required: boolean;
    is_currency: boolean;
    options: string;
}

export type DocumentFieldZone = "header" | "content" | "footer";

const EMPTY_DRAFT: DocumentFieldDraft = {
    name: "",
    label: "",
    data_type: "text",
    is_required: false,
    is_currency: false,
    options: "",
};

function getErrorMessage(cause: unknown): string {
    return cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : "Ocurrió un error al configurar los campos del documento.";
}

function isCurrencyType(type: DocumentFieldDataType): boolean {
    return type === "number" || type === "decimal" || type === "currency";
}

export const useDocumentFieldEditor = (documentType: DocumentTypes) => {
    const [fields, setFields] = useState<DocumentTypeField[]>([]);
    const [headers, setHeaders] = useState<DocumentTypeZoneRecord[]>([]);
    const [footers, setFooters] = useState<DocumentTypeZoneRecord[]>([]);
    const [draft, setDraft] = useState<DocumentFieldDraft>(EMPTY_DRAFT);
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const { notify } = useToast();

    const load = useCallback(async (showError = true): Promise<boolean> => {
        setLoading(true);
        setError("");
        try {
            const listAll = async <T,>(
                resource: "document-type-fields" | "document-type-headers" | "document-type-footers",
            ): Promise<T[]> => {
                const items: T[] = [];
                let offset = 0;
                let hasMore = true;
                while (hasMore) {
                    const page = await apiClient.list<T>(resource, { limit: 200, offset });
                    items.push(...page.items);
                    hasMore = page.items.length === page.limit;
                    offset += page.limit;
                }
                return items;
            };
            const [allFields, allHeaders, allFooters] = await Promise.all([
                listAll<DocumentTypeField>("document-type-fields"),
                listAll<DocumentTypeZoneRecord>("document-type-headers"),
                listAll<DocumentTypeZoneRecord>("document-type-footers"),
            ]);
            setFields(allFields.filter((field) => field.document_type_id === documentType.id));
            setHeaders(allHeaders.filter((item) => item.document_type_id === documentType.id));
            setFooters(allFooters.filter((item) => item.document_type_id === documentType.id));
            return true;
        } catch (cause: unknown) {
            const message = getErrorMessage(cause);
            setError(message);
            if (showError) notify("error", message);
            return false;
        } finally {
            setLoading(false);
        }
    }, [documentType.id, notify]);

    useEffect(() => {
        void load();
    }, [load]);

    const updateDraft = useCallback(<K extends keyof DocumentFieldDraft>(
        key: K,
        value: DocumentFieldDraft[K],
    ) => {
        setDraft((current) => ({ ...current, [key]: value }));
    }, []);

    const startEditField = useCallback((field: DocumentTypeField) => {
        const values = field.options.values;
        setEditingFieldId(field.id);
        setDraft({
            name: field.name,
            label: field.label,
            data_type: field.data_type,
            is_required: field.is_required,
            is_currency: field.is_currency,
            options: Array.isArray(values)
                ? values.filter((value): value is string => typeof value === "string").join("\n")
                : "",
        });
        setError("");
    }, []);

    const cancelEditField = useCallback(() => {
        setEditingFieldId(null);
        setDraft(EMPTY_DRAFT);
        setError("");
    }, []);

    const saveField = useCallback(async (values: DocumentFieldDraft): Promise<boolean> => {
        const name = values.name.trim();
        const label = values.label.trim();
        if (!name || !label) {
            setError("El nombre y la etiqueta del campo son obligatorios.");
            return false;
        }

        const options = values.data_type === "select"
            ? {
                values: values.options
                    .split("\n")
                    .map((option) => option.trim())
                    .filter(Boolean),
            }
            : {};
        const placedNames = new Set([
            ...headers.map((item) => item.field_name),
            ...footers.map((item) => item.field_name),
        ]);
        const nextContentPosition = fields
            .filter((field) => !placedNames.has(field.name))
            .reduce((next, field) => Math.max(next, field.position + 1), 0);

        setSaving(true);
        setError("");
        try {
            if (editingFieldId) {
                const currentField = fields.find((field) => field.id === editingFieldId);
                if (!currentField) {
                    throw new Error("No se encontró el campo que intentas editar.");
                }
                if (fields.some((field) => field.id !== editingFieldId && field.name === name)) {
                    throw new Error("Ya existe un campo con ese nombre interno.");
                }

                const references = [
                    ...headers
                        .filter((item) => item.field_name === currentField.name &&
                            (item.field_name !== name || item.title !== label))
                        .map((record) => ({ resource: "document-type-headers" as const, record })),
                    ...footers
                        .filter((item) => item.field_name === currentField.name &&
                            (item.field_name !== name || item.title !== label))
                        .map((record) => ({ resource: "document-type-footers" as const, record })),
                ];
                const referenceResults = await Promise.allSettled(references.map(({ resource, record }) =>
                    apiClient.update<DocumentTypeZoneRecord>(resource, record.id, {
                        field_name: name,
                        title: label,
                    }),
                ));
                const updatedReferences = referenceResults.flatMap((result, index) =>
                    result.status === "fulfilled"
                        ? [{ reference: references[index], updated: result.value }]
                        : [],
                );
                const referenceFailure = referenceResults.find((result) => result.status === "rejected");
                if (referenceFailure?.status === "rejected") {
                    const rollback = await Promise.allSettled(updatedReferences.map(({ reference }) =>
                        apiClient.update<DocumentTypeZoneRecord>(
                            reference.resource,
                            reference.record.id,
                            {
                                field_name: reference.record.field_name,
                                title: reference.record.title,
                            },
                        ),
                    ));
                    const rollbackFailed = rollback.some((result) => result.status === "rejected");
                    throw new Error(
                        `${getErrorMessage(referenceFailure.reason)}${rollbackFailed
                            ? " No se pudieron revertir todas las referencias; vuelve a cargar la configuración."
                            : ""}`,
                    );
                }

                let updated: DocumentTypeField;
                try {
                    updated = await apiClient.update<DocumentTypeField>(
                        "document-type-fields",
                        editingFieldId,
                        {
                            name,
                            label,
                            data_type: values.data_type,
                            is_required: values.is_required,
                            is_currency: isCurrencyType(values.data_type) && values.is_currency,
                            options,
                        },
                    );
                } catch (cause: unknown) {
                    const rollback = await Promise.allSettled(updatedReferences.map(({ reference }) =>
                        apiClient.update<DocumentTypeZoneRecord>(
                            reference.resource,
                            reference.record.id,
                            {
                                field_name: reference.record.field_name,
                                title: reference.record.title,
                            },
                        ),
                    ));
                    if (rollback.some((result) => result.status === "rejected")) {
                        throw new Error(
                            `${getErrorMessage(cause)} No se pudieron revertir todas las referencias; vuelve a cargar la configuración.`,
                        );
                    }
                    throw cause;
                }

                setFields((current) => current.map((field) => field.id === updated.id ? updated : field));
                setHeaders((current) => current.map((item) =>
                    updatedReferences.find(({ reference, updated: updatedItem }) =>
                        reference.resource === "document-type-headers" && updatedItem.id === item.id,
                    )?.updated ?? item,
                ));
                setFooters((current) => current.map((item) =>
                    updatedReferences.find(({ reference, updated: updatedItem }) =>
                        reference.resource === "document-type-footers" && updatedItem.id === item.id,
                    )?.updated ?? item,
                ));
                setEditingFieldId(null);
                setDraft(EMPTY_DRAFT);
                notify("success", "Campo actualizado.");
                return true;
            }

            const created = await apiClient.create<DocumentTypeField>("document-type-fields", {
                document_type_id: documentType.id,
                name,
                label,
                data_type: values.data_type,
                is_required: values.is_required,
                is_currency: isCurrencyType(values.data_type) && values.is_currency,
                position: nextContentPosition,
                options,
            });
            setFields((current) => [...current, created]);
            setDraft(EMPTY_DRAFT);
            notify("success", "Campo agregado al documento.");
            return true;
        } catch (cause: unknown) {
            const message = getErrorMessage(cause);
            await load(false);
            setError(message);
            notify("error", message);
            return false;
        } finally {
            setSaving(false);
        }
    }, [documentType.id, editingFieldId, fields, footers, headers, load, notify]);

    const deleteField = useCallback(async (field: DocumentTypeField) => {
        const fieldHeaders = headers.filter((item) => item.field_name === field.name);
        const fieldFooters = footers.filter((item) => item.field_name === field.name);
        setSaving(true);
        setError("");
        try {
            await Promise.all([
                ...fieldHeaders.map((item) => apiClient.remove("document-type-headers", item.id)),
                ...fieldFooters.map((item) => apiClient.remove("document-type-footers", item.id)),
            ]);
            await apiClient.remove("document-type-fields", field.id);
            setFields((current) => current.filter((item) => item.id !== field.id));
            setHeaders((current) => current.filter((item) => item.field_name !== field.name));
            setFooters((current) => current.filter((item) => item.field_name !== field.name));
            notify("success", "Campo eliminado.");
        } catch (cause: unknown) {
            const message = getErrorMessage(cause);
            setError(message);
            notify("error", message);
            await load(false);
        } finally {
            setSaving(false);
        }
    }, [footers, headers, load, notify]);

    const moveField = useCallback(async (
        fieldId: string,
        targetZone: DocumentFieldZone,
        targetIndex: number,
    ) => {
        const ordered = (zone: DocumentFieldZone): DocumentTypeField[] => {
            if (zone === "header") {
                return [...headers]
                    .sort((a, b) => a.position - b.position)
                    .map((item) => fields.find((field) => field.name === item.field_name))
                    .filter((field): field is DocumentTypeField => Boolean(field));
            }
            if (zone === "footer") {
                return [...footers]
                    .sort((a, b) => a.position - b.position)
                    .map((item) => fields.find((field) => field.name === item.field_name))
                    .filter((field): field is DocumentTypeField => Boolean(field));
            }
            const placedNames = new Set([
                ...headers.map((item) => item.field_name),
                ...footers.map((item) => item.field_name),
            ]);
            return fields
                .filter((field) => !placedNames.has(field.name))
                .sort((a, b) => a.position - b.position);
        };

        const field = fields.find((item) => item.id === fieldId);
        if (!field) return;

        const nextOrders: Record<DocumentFieldZone, DocumentTypeField[]> = {
            header: ordered("header"),
            content: ordered("content"),
            footer: ordered("footer"),
        };
        const sourceIndex = nextOrders[targetZone].findIndex((item) => item.id === fieldId);
        for (const zone of Object.keys(nextOrders) as DocumentFieldZone[]) {
            nextOrders[zone] = nextOrders[zone].filter((item) => item.id !== fieldId);
        }
        const target = nextOrders[targetZone];
        const adjustedIndex = sourceIndex >= 0 && sourceIndex < targetIndex
            ? targetIndex - 1
            : targetIndex;
        const insertionIndex = Math.max(0, Math.min(adjustedIndex, target.length));
        target.splice(insertionIndex, 0, field);

        setSaving(true);
        setError("");
        try {
            const persistZone = async (
                resource: "document-type-headers" | "document-type-footers",
                current: DocumentTypeZoneRecord[],
                desired: DocumentTypeField[],
            ) => {
                const retainedIds = new Set<string>();
                await Promise.all(desired.map(async (item, position) => {
                    const existing = current.find((record) =>
                        record.field_name === item.name && !retainedIds.has(record.id),
                    );
                    if (existing) {
                        retainedIds.add(existing.id);
                        await apiClient.update<DocumentTypeZoneRecord>(resource, existing.id, {
                            title: item.label,
                            field_name: item.name,
                            position,
                        });
                    } else {
                        await apiClient.create<DocumentTypeZoneRecord>(resource, {
                            document_type_id: documentType.id,
                            title: item.label,
                            field_name: item.name,
                            position,
                            metadata: {},
                        });
                    }
                }));
                return retainedIds;
            };

            const [retainedHeaders, retainedFooters] = await Promise.all([
                persistZone("document-type-headers", headers, nextOrders.header),
                persistZone("document-type-footers", footers, nextOrders.footer),
            ]);

            const knownNames = new Set(fields.map((item) => item.name));
            await Promise.all([
                ...headers
                    .filter((item) => item.field_name && knownNames.has(item.field_name) && !retainedHeaders.has(item.id))
                    .map((item) => apiClient.remove("document-type-headers", item.id)),
                ...footers
                    .filter((item) => item.field_name && knownNames.has(item.field_name) && !retainedFooters.has(item.id))
                    .map((item) => apiClient.remove("document-type-footers", item.id)),
                ...nextOrders.content.map((item, position) =>
                    apiClient.update<DocumentTypeField>("document-type-fields", item.id, { position }),
                ),
            ]);

            const loaded = await load(false);
            if (!loaded) {
                notify("error", "La configuración se guardó, pero no se pudo actualizar la vista.");
                return;
            }
            notify("success", "Distribución de campos guardada.");
        } catch (cause: unknown) {
            const message = getErrorMessage(cause);
            setError(message);
            notify("error", message);
            await load(false);
            setError(message);
        } finally {
            setSaving(false);
        }
    }, [documentType.id, fields, footers, headers, load, notify]);

    const updateFieldType = useCallback((type: DocumentFieldDataType) => {
        setDraft((current) => ({
            ...current,
            data_type: type,
            is_currency: isCurrencyType(type) && current.is_currency,
        }));
    }, []);

    return {
        fields,
        headers,
        footers,
        draft,
        loading,
        saving,
        error,
        load,
        updateDraft,
        updateFieldType,
        editingFieldId,
        startEditField,
        cancelEditField,
        saveField,
        deleteField,
        moveField,
    };
};
