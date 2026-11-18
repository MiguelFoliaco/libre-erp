import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiClient, ApiError } from "../../../../lib/sdk";
import type {
    Customer,
    CustomerPerson,
    CustomerSearchResult,
    CustomerType,
    DocumentTypePeople,
    People,
} from "../../../../lib/crm";
import type { PersonSearchResult } from "../../../../lib/user-and-roles";
import type { PersonWritePayload } from "../../peoples/form/hook";
import { useToast } from "../../../common/toast";
import { text } from "../../../language";

export type ClientModalMode = "create" | "edit" | "view" | "disable" | null;
export type CustomerWritePayload = Pick<
    Customer,
    "customer_code" | "customer_type_id" | "credit_limit" | "payment_terms_days" | "metadata"
>;

export interface CustomerFormValues {
    customer_code: string;
    customer_type_id: string;
    credit_limit: string;
    payment_terms_days: string;
}

function getErrorMessage(cause: unknown): string {
    return cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : text("modules.crm.common.operationFailed");
}

export function useClients() {
    const { notify } = useToast();
    const [clients, setClients] = useState<CustomerSearchResult[]>([]);
    const [searchResults, setSearchResults] = useState<CustomerSearchResult[] | null>(null);
    const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
    const [documentTypes, setDocumentTypes] = useState<DocumentTypePeople[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [saving, setSaving] = useState(false);
    const [modalMode, setModalMode] = useState<ClientModalMode>(null);
    const [selectedClient, setSelectedClient] = useState<CustomerSearchResult | null>(null);

    useEffect(() => {
        let mounted = true;
        Promise.allSettled([
            apiClient.searchCustomers().then((result) => {
                if (mounted) setClients(result);
            }),
            apiClient.list<CustomerType>("customer-types").then((result) => {
                if (mounted) setCustomerTypes(result.items);
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
        if (value.length < 2) {
            notify("info", text("modules.crm.clientMessages.searchTooShort"));
            return;
        }
        setLoadingSearch(true);
        try {
            setSearchResults(await apiClient.searchCustomers(value));
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setLoadingSearch(false);
        }
    }, [notify]);

    const clearSearch = useCallback(() => setSearchResults(null), []);

    const openModal = useCallback((mode: Exclude<ClientModalMode, null>, client: CustomerSearchResult | null = null) => {
        setSelectedClient(client);
        setModalMode(mode);
    }, []);

    const closeModal = useCallback(() => {
        if (!saving) {
            setModalMode(null);
            setSelectedClient(null);
        }
    }, [saving]);

    const saveClient = useCallback(async (
        client: CustomerSearchResult | null,
        payload: CustomerWritePayload,
        person: CustomerPerson | null,
        newPerson: PersonWritePayload | null,
    ) => {
        setSaving(true);
        try {
            let saved: Customer;
            let savedPerson: CustomerPerson;
            if (client) {
                saved = await apiClient.update<Customer>("customers", client.id, payload);
                savedPerson = client.person;
            } else {
                if (!person && !newPerson) {
                    throw new Error(text("modules.crm.clientMessages.personRequired"));
                }
                const body = newPerson
                    ? { ...payload, person: newPerson }
                    : { ...payload, person_id: person?.id };
                saved = await apiClient.create<Customer>("customers", body);
                if (person) {
                    savedPerson = person;
                } else if (newPerson) {
                    savedPerson = { ...newPerson, id: saved.person_id };
                } else {
                    throw new Error(text("modules.crm.clientMessages.personUnavailable"));
                }
            }
            const result: CustomerSearchResult = {
                ...saved,
                person: savedPerson,
                customer_type_name: customerTypes.find((type) => type.id === saved.customer_type_id)?.name ?? "",
            };
            if (client) {
                setClients((current) => current.map((item) => item.id === result.id ? result : item));
                setSearchResults((current) => current?.map((item) => item.id === result.id ? result : item) ?? null);
                notify("success", text("modules.crm.clientMessages.updated"));
            } else {
                setClients((current) => [...current, result]);
                notify("success", text("modules.crm.clientMessages.created"));
            }
            setModalMode(null);
            setSelectedClient(null);
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setSaving(false);
        }
    }, [customerTypes, notify]);

    const disableClient = useCallback(async () => {
        if (!selectedClient) return;
        setSaving(true);
        try {
            const updated = await apiClient.update<Customer>("customers", selectedClient.id, { is_active: false });
            const result: CustomerSearchResult = { ...selectedClient, ...updated };
            setClients((current) => current.map((item) => item.id === result.id ? result : item));
            setSearchResults((current) => current?.map((item) => item.id === result.id ? result : item) ?? null);
            notify("success", text("modules.crm.clientMessages.disabled"));
            setModalMode(null);
            setSelectedClient(null);
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setSaving(false);
        }
    }, [notify, selectedClient]);

    return {
        clients: searchResults ?? clients,
        customerTypes,
        documentTypes,
        loading,
        loadingSearch,
        saving,
        modalMode,
        selectedClient,
        search,
        clearSearch,
        openModal,
        closeModal,
        saveClient,
        disableClient,
    };
}

export function useCustomerForm({
    open,
    client,
    customerTypes,
    onSave,
}: {
    open: boolean;
    client: CustomerSearchResult | null;
    customerTypes: CustomerType[];
    onSave: (
        client: CustomerSearchResult | null,
        payload: CustomerWritePayload,
        person: CustomerPerson | null,
        newPerson: PersonWritePayload | null,
    ) => Promise<void>;
}) {
    const { notify } = useToast();
    const [values, setValues] = useState<CustomerFormValues>({
        customer_code: "",
        customer_type_id: "",
        credit_limit: "0",
        payment_terms_days: "0",
    });
    const [selectedPerson, setSelectedPerson] = useState<CustomerPerson | null>(null);
    const [newPerson, setNewPerson] = useState<PersonWritePayload | null>(null);
    const [personQuery, setPersonQuery] = useState("");
    const [peopleMatches, setPeopleMatches] = useState<PersonSearchResult[]>([]);
    const [searchingPeople, setSearchingPeople] = useState(false);
    const [personModalOpen, setPersonModalOpen] = useState(false);


    useEffect(() => {
        if (!open) return;
        setValues({
            customer_code: client?.customer_code ?? "",
            customer_type_id: client?.customer_type_id ?? customerTypes[0]?.id ?? "",
            credit_limit: client?.credit_limit ?? "0",
            payment_terms_days: String(client?.payment_terms_days ?? 0),
        });
        setSelectedPerson(client?.person ?? null);
        setNewPerson(null);
        setPersonQuery("");
        setPeopleMatches([]);
        setPersonModalOpen(false);
    }, [client, customerTypes, open]);

    const updateField = useCallback(<K extends keyof CustomerFormValues>(field: K, value: CustomerFormValues[K]) => {
        setValues((current) => ({ ...current, [field]: value }));
    }, []);

    const searchPeople = useCallback(async () => {
        const query = personQuery.trim();
        if (query.length < 2) {
            notify("info", text("modules.crm.clientMessages.personSearchTooShort"));
            return;
        }
        setSearchingPeople(true);
        try {
            setPeopleMatches(await apiClient.searchPeople(query));
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setSearchingPeople(false);
        }
    }, [notify, personQuery]);

    const choosePerson = useCallback(async (match: PersonSearchResult) => {
        setSearchingPeople(true);
        try {
            const person = await apiClient.get<People>("people", match.id);
            setSelectedPerson(person);
            setNewPerson(null);
            setPersonQuery("");
            setPeopleMatches([]);
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setSearchingPeople(false);
        }
    }, [notify]);

    const clearPerson = useCallback(() => {
        if (client) return;
        setSelectedPerson(null);
        setNewPerson(null);
    }, [client]);

    const stageNewPerson = useCallback(async (_person: People | null, payload: PersonWritePayload) => {
        setNewPerson(payload);
        setSelectedPerson(null);
        setPersonModalOpen(false);
    }, []);

    const submit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!client && !selectedPerson && !newPerson) {
            notify("error", text("modules.crm.clientMessages.personRequiredOnSubmit"));
            return;
        }
        const creditLimit = Number(values.credit_limit);
        const paymentTermsDays = Number(values.payment_terms_days);
        if (!Number.isFinite(creditLimit) || creditLimit < 0) {
            notify("error", text("modules.crm.clientMessages.invalidCreditLimit"));
            return;
        }
        if (!Number.isSafeInteger(paymentTermsDays) || paymentTermsDays < 0) {
            notify("error", text("modules.crm.clientMessages.invalidPaymentDays"));
            return;
        }
        await onSave(client, {
            customer_code: values.customer_code.trim() || null,
            customer_type_id: values.customer_type_id,
            credit_limit: String(creditLimit),
            payment_terms_days: paymentTermsDays,
            metadata: client?.metadata ?? {},
        }, selectedPerson, newPerson);
    }, [client, newPerson, notify, onSave, selectedPerson, values]);

    const generateCodeClient = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            code += characters.charAt(randomIndex);
        }
        setValues((current) => ({ ...current, customer_code: code }));
    }

    return {
        values,
        selectedPerson,
        newPerson,
        personQuery,
        peopleMatches,
        searchingPeople,
        personModalOpen,
        updateField,
        setPersonQuery,
        searchPeople,
        choosePerson,
        clearPerson,
        stageNewPerson,
        setPersonModalOpen,
        submit,
        generateCodeClient
    };
}
