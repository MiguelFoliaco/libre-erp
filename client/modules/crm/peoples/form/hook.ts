import { useCallback, useEffect, useState, type FormEvent } from "react";
import { config, type AddressValues } from "../../../../config";
import { apiClient, ApiError } from "../../../../lib/sdk";
import type { DocumentTypePeople, People } from "../../../../lib/crm";
import { useToast } from "../../../common/toast";

export type PersonModalMode = "create" | "edit" | "view" | "disable" | null;

export interface PersonFormValues {
    first_name: string;
    middle_name: string;
    last_name: string;
    second_last_name: string;
    document_types_people_id: string;
    document_number: string;
    email: string;
    phone: string;
    birth_date: string;
    address: AddressValues;
}

export type PersonWritePayload = Omit<
    People,
    | "id"
    | "company_id"
    | "environment_id"
    | "created_at"
    | "updated_at"
    | "is_active"
    | "middle_name"
    | "second_last_name"
    | "document_number"
    | "email"
    | "phone"
    | "birth_date"
> & {
    middle_name: string | null;
    second_last_name: string | null;
    document_number: string | null;
    email: string | null;
    phone: string | null;
    birth_date: string | null;
    is_active?: boolean;
};

function getErrorMessage(cause: unknown): string {
    return cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : "No fue posible completar la operación.";
}

function emptyAddress(): AddressValues {
    return Object.fromEntries(
        config.addressConfig.fields.map((field) => [field, ""]),
    ) as AddressValues;
}

function toFormValues(person: People | null, documentTypes: DocumentTypePeople[]): PersonFormValues {
    const address = emptyAddress();
    for (const field of config.addressConfig.fields) {
        const value = person?.address?.[field];
        if (typeof value === "string") address[field] = value;
    }

    return {
        first_name: person?.first_name ?? "",
        middle_name: person?.middle_name ?? "",
        last_name: person?.last_name ?? "",
        second_last_name: person?.second_last_name ?? "",
        document_types_people_id:
            person?.document_types_people_id ?? documentTypes[0]?.id ?? "",
        document_number: person?.document_number ?? "",
        email: person?.email ?? "",
        phone: person?.phone ?? "",
        birth_date: person?.birth_date?.slice(0, 10) ?? "",
        address,
    };
}

export function usePeople() {
    const { notify } = useToast();
    const [people, setPeople] = useState<People[]>([]);
    const [searchResults, setSearchResults] = useState<People[] | null>(null);
    const [documentTypes, setDocumentTypes] = useState<DocumentTypePeople[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [saving, setSaving] = useState(false);
    const [modalMode, setModalMode] = useState<PersonModalMode>(null);
    const [selectedPerson, setSelectedPerson] = useState<People | null>(null);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        Promise.allSettled([
            apiClient.list<People>("people").then((result) => {
                if (mounted) setPeople(result.items);
            }),
            apiClient.list<DocumentTypePeople>("document-types-people").then((result) => {
                if (mounted) setDocumentTypes(result.items);
            }),
        ])
            .then((results) => {
                for (const result of results) {
                    if (mounted && result.status === "rejected") {
                        notify("error", getErrorMessage(result.reason));
                    }
                }
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, [notify]);

    const search = useCallback(async (query: string) => {
        const value = query.trim();
        if (!value) {
            notify("info", "Ingrese un valor para realizar la búsqueda.");
            return;
        }
        if (value.length <= 2) {
            notify("info", "El valor debe ser mayor a 2 caracteres.");
            return;
        }

        setLoadingSearch(true);
        try {
            const matches = await apiClient.searchPeople(value);
            const fullRecords = await Promise.all(
                matches.map(({ id }) => apiClient.get<People>("people", id)),
            );
            setSearchResults(fullRecords);
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setLoadingSearch(false);
        }
    }, [notify]);

    const clearSearch = useCallback(() => setSearchResults(null), []);

    const openModal = useCallback((mode: Exclude<PersonModalMode, null>, person: People | null = null) => {
        setSelectedPerson(person);
        setModalMode(mode);
    }, []);

    const closeModal = useCallback(() => {
        if (!saving) {
            setModalMode(null);
            setSelectedPerson(null);
        }
    }, [saving]);

    const savePerson = useCallback(async (person: People | null, payload: PersonWritePayload) => {
        setSaving(true);
        try {
            if (person) {
                const updated = await apiClient.update<People>("people", person.id, payload);
                setPeople((current) => current.map((item) => item.id === updated.id ? updated : item));
                setSearchResults((current) => current?.map((item) => item.id === updated.id ? updated : item) ?? null);
                notify("success", "Los datos de la persona se actualizaron correctamente.");
            } else {
                const created = await apiClient.create<People>("people", payload);
                setPeople((current) => [...current, created]);
                notify("success", "La persona se creó correctamente.");
            }
            setModalMode(null);
            setSelectedPerson(null);
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setSaving(false);
        }
    }, [notify]);

    const disablePerson = useCallback(async () => {
        if (!selectedPerson) return;
        setSaving(true);
        try {
            const updated = await apiClient.update<People>("people", selectedPerson.id, { is_active: false });
            setPeople((current) => current.map((item) => item.id === updated.id ? updated : item));
            setSearchResults((current) => current?.map((item) => item.id === updated.id ? updated : item) ?? null);
            notify("success", "La persona quedó deshabilitada.");
            setModalMode(null);
            setSelectedPerson(null);
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setSaving(false);
        }
    }, [notify, selectedPerson]);

    return {
        people: searchResults ?? people,
        documentTypes,
        loading,
        loadingSearch,
        saving,
        modalMode,
        selectedPerson,
        search,
        clearSearch,
        openModal,
        closeModal,
        savePerson,
        disablePerson,
    };
}

export function usePersonForm({
    open,
    person,
    documentTypes,
    onSave,
}: {
    open: boolean;
    person: People | null;
    documentTypes: DocumentTypePeople[];
    onSave: (person: People | null, payload: PersonWritePayload) => Promise<void>;
}) {
    const [values, setValues] = useState<PersonFormValues>(() => toFormValues(person, documentTypes));

    useEffect(() => {
        if (open) setValues(toFormValues(person, documentTypes));
    }, [documentTypes, open, person]);

    const updateField = useCallback(<K extends keyof PersonFormValues>(field: K, value: PersonFormValues[K]) => {
        setValues((current) => ({ ...current, [field]: value }));
    }, []);

    const updateAddress = useCallback((field: keyof AddressValues, value: string) => {
        setValues((current) => ({
            ...current,
            address: { ...current.address, [field]: value },
        }));
    }, []);

    const submit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const addressFields = config.addressConfig.order.filter((field) => values.address[field].trim());
        const payload: PersonWritePayload = {
            first_name: values.first_name.trim(),
            middle_name: values.middle_name.trim() || null,
            last_name: values.last_name.trim(),
            second_last_name: values.second_last_name.trim() || null,
            document_types_people_id: values.document_types_people_id,
            document_number: values.document_number.trim() || null,
            email: values.email.trim() || null,
            phone: values.phone.trim() || null,
            birth_date: values.birth_date || null,
            address: values.address,
            address_fields: addressFields,
            address_str: addressFields.map((field) => values.address[field].trim()).join(", "),
            metadata: person?.metadata ?? {},
        };
        await onSave(person, payload);
    }, [onSave, person, values]);

    return { values, updateField, updateAddress, submit };
}
