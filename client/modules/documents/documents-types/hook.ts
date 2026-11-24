import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { DocumentTypes, DocumentTypesInsert } from "@/lib/document";
import { apiClient, ApiError } from "@/lib/sdk";
import { useToast } from "../../common/toast";
import { generateIdAlphaNum } from "../../common/utils/generate-ids";

const PAGE_SIZE = 50;

export interface DocumentTypeFormValues {
    name: string;
    code: string;
    description: string;
    category: string;
    numbering_prefix: string;
    next_number: string;
    end_number: string;
}

const EMPTY_FORM: DocumentTypeFormValues = {
    name: "",
    code: "",
    description: "",
    category: "",
    numbering_prefix: "",
    next_number: "1",
    end_number: "-1",
};

function getErrorMessage(cause: unknown): string {
    return cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : "Ocurrió un error al procesar el tipo de documento.";
}

function toFormValues(document: DocumentTypes): DocumentTypeFormValues {
    return {
        name: document.name,
        code: document.code,
        description: document.description ?? "",
        category: document.category ?? "",
        numbering_prefix: document.numbering_prefix ?? "",
        next_number: String(document.next_number),
        end_number: String(document.end_number),
    };
}

export const useDocumentsTypesHooks = () => {
    const [documents, setDocuments] = useState<DocumentTypes[]>([]);
    const [pagination, setPagination] = useState({
        limit: PAGE_SIZE,
        offset: 0,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [formVisible, setFormVisible] = useState(false);
    const [editingDocument, setEditingDocument] = useState<DocumentTypes | null>(null);
    const [form, setForm] = useState<DocumentTypeFormValues>(EMPTY_FORM);
    const [error, setError] = useState("");

    const { notify } = useToast();

    const load = useCallback(async (limit = PAGE_SIZE, offset = 0) => {
        setLoading(true);
        try {
            const result = await apiClient.list<DocumentTypes>("document-types", {
                limit,
                offset,
            });
            setDocuments(result.items);
            setPagination({ limit: result.limit, offset: result.offset });
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        void load();
    }, [load]);

    const refresh = useCallback(() => load(pagination.limit, pagination.offset), [load, pagination]);
    const next = useCallback(
        () => load(pagination.limit, pagination.offset + pagination.limit),
        [load, pagination],
    );
    const prev = useCallback(
        () => load(pagination.limit, Math.max(0, pagination.offset - pagination.limit)),
        [load, pagination],
    );

    const updateField = useCallback(<K extends keyof DocumentTypeFormValues>(
        field: K,
        value: DocumentTypeFormValues[K],
    ) => {
        setForm((current) => ({ ...current, [field]: value }));
    }, []);

    const startCreate = useCallback(() => {
        setEditingDocument(null);
        setForm(EMPTY_FORM);
        setError("");
        setFormVisible(true);
    }, []);

    const startEdit = useCallback((document: DocumentTypes) => {
        setEditingDocument(document);
        setForm(toFormValues(document));
        setError("");
        setFormVisible(true);
    }, []);

    const cancelForm = useCallback(() => {
        if (saving) return;
        setFormVisible(false);
        setEditingDocument(null);
        setForm(EMPTY_FORM);
        setError("");
    }, [saving]);

    const generateCode = useCallback(() => {
        updateField("code", generateIdAlphaNum(3).toUpperCase());
    }, [updateField]);

    const generatePrefix = useCallback(() => {
        updateField("numbering_prefix", generateIdAlphaNum(3).toUpperCase());
    }, [updateField]);

    const submit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextNumber = Number(form.next_number);
        const endNumber = Number(form.end_number);

        if (!Number.isInteger(nextNumber) || nextNumber < 1) {
            setError("El siguiente número debe ser un entero mayor que cero.");
            return;
        }
        if (!Number.isInteger(endNumber) || (endNumber !== -1 && endNumber < nextNumber)) {
            setError("El número final debe ser -1 (sin límite) o igual/mayor al siguiente número.");
            return;
        }

        const payload: Pick<
            DocumentTypesInsert,
            "name" | "code" | "description" | "category" | "numbering_prefix" | "next_number" | "end_number"
        > = {
            name: form.name.trim(),
            code: form.code.trim(),
            description: form.description.trim() || null,
            category: form.category.trim() || null,
            numbering_prefix: form.numbering_prefix.trim() || null,
            next_number: nextNumber,
            end_number: endNumber,
        };

        setSaving(true);
        setError("");
        try {
            if (editingDocument) {
                const updated = await apiClient.update<DocumentTypes>(
                    "document-types",
                    editingDocument.id,
                    payload,
                );
                setDocuments((current) =>
                    current.map((document) => document.id === updated.id ? updated : document),
                );
                notify("success", "Tipo de documento actualizado.");
            } else {
                const insert: DocumentTypesInsert = {
                    ...payload,
                    is_active: true,
                    metadata: {},
                };
                await apiClient.create<DocumentTypes>("document-types", insert);
                await load(pagination.limit, pagination.offset);
                notify("success", "Tipo de documento creado.");
            }
            // setFormVisible(false);
            setEditingDocument(null);
            setForm(EMPTY_FORM);
        } catch (cause: unknown) {
            const message = getErrorMessage(cause);
            setError(message);
            notify("error", message);
        } finally {
            setSaving(false);
        }
    }, [editingDocument, form, load, notify, pagination]);

    const toggleActive = useCallback(async (document: DocumentTypes) => {
        setBusyId(document.id);
        try {
            const updated = await apiClient.update<DocumentTypes>(
                "document-types",
                document.id,
                { is_active: !document.is_active },
            );
            setDocuments((current) =>
                current.map((item) => item.id === updated.id ? updated : item),
            );
            notify("success", updated.is_active
                ? "Tipo de documento activado."
                : "Tipo de documento desactivado.");
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setBusyId(null);
        }
    }, [notify]);

    return {
        documents,
        pagination,
        loading,
        saving,
        busyId,
        formVisible,
        editingDocument,
        form,
        error,
        load,
        next,
        prev,
        refresh,
        updateField,
        startCreate,
        startEdit,
        cancelForm,
        generateCode,
        generatePrefix,
        submit,
        toggleActive,
    };
};
