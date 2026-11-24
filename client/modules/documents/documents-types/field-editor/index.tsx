import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import {
    CalendarDays,
    Check,
    FileText,
    GripVertical,
    Hash,
    PanelTop,
    Pencil,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import type { DocumentTypes } from "@/lib/document";
import { config } from '@/config';
import {
    type DocumentFieldDataType,
    type DocumentFieldZone,
    type DocumentTypeField,
    useDocumentFieldEditor,
} from "./hook";

type Props = {
    documentSelected: DocumentTypes;
    onClose: () => void;
};

const DATA_TYPES: { value: DocumentFieldDataType; label: string }[] = [
    { value: "text", label: "Texto" },
    { value: "textarea", label: "Texto largo" },
    { value: "number", label: "Número entero" },
    { value: "decimal", label: "Número decimal" },
    { value: "currency", label: "Moneda" },
    { value: "date", label: "Fecha" },
    { value: "datetime", label: "Fecha y hora" },
    { value: "boolean", label: "Sí / No" },
    { value: "select", label: "Lista de opciones" },
    { value: "json", label: "JSON" },
];


interface DocumentVariable {
    name: string;
    type: string;
    description: string;
    value: string;
}

interface DocumentVariableGroup {
    name: string;
    variables: DocumentVariable[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDocumentVariable(value: unknown): value is Omit<DocumentVariable, "name"> {
    return isRecord(value) &&
        typeof value.type === "string" &&
        typeof value.description === "string" &&
        typeof value.value === "string";
}

function getDocumentVariableGroups(fields: typeof config.documentVars.fields): DocumentVariableGroup[] {
    return Object.entries(fields).flatMap(([groupName, groupValue]) => {
        if (!isRecord(groupValue)) return [];
        const variables = Object.entries(groupValue).flatMap(([name, value]) =>
            isDocumentVariable(value) ? [{ name, ...value }] : [],
        );
        return variables.length > 0 ? [{ name: groupName, variables }] : [];
    });
}

const VARIABLE_GROUPS = getDocumentVariableGroups(config.documentVars.fields);
const VARIABLE_GROUP_LABELS: Record<string, string> = {
    client: "Clientes",
    supplier: "Proveedores",
    product: "Productos",
    global: "Generales",
};

const TYPE_LABELS = new Map(DATA_TYPES.map((type) => [type.value, type.label]));

export const FieldEditor = ({ documentSelected, onClose }: Props) => {
    const {
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
    } = useDocumentFieldEditor(documentSelected);
    const [nameSuggestionsOpen, setNameSuggestionsOpen] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

    const zones = useMemo(() => {
        const byName = new Map(fields.map((field) => [field.name, field]));
        const orderedFields = (records: typeof headers) => [...records]
            .sort((a, b) => a.position - b.position)
            .map((record) => byName.get(record.field_name ?? ""))
            .filter((field): field is DocumentTypeField => Boolean(field));
        const placedNames = new Set([
            ...headers.map((item) => item.field_name),
            ...footers.map((item) => item.field_name),
        ]);
        return {
            header: orderedFields(headers),
            content: fields
                .filter((field) => !placedNames.has(field.name))
                .sort((a, b) => a.position - b.position),
            footer: orderedFields(footers),
        };
    }, [fields, footers, headers]);

    const submitField = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await saveField(draft);
    };

    const handleDrop = (event: DragEvent<HTMLElement>, zone: DocumentFieldZone, index: number) => {
        event.preventDefault();
        event.stopPropagation();
        const fieldId = event.dataTransfer.getData("text/plain");
        if (fieldId) void moveField(fieldId, zone, index);
    };

    const renderZone = (
        zone: DocumentFieldZone,
        title: string,
        description: string,
        icon: typeof PanelTop,
        items: DocumentTypeField[],
    ) => {
        const Icon = icon;
        return (
            <section
                className="flex min-h-44 flex-col rounded-lg border border-base-300 bg-base-100"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, zone, items.length)}
                aria-label={title}
            >
                <div className=" flex items-start gap-3 border-b border-base-200 px-4 py-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-base-200 text-base-content/70">
                        <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold">{title}</h3>
                        <p className="text-xs text-base-content/55">{description}</p>
                    </div>
                    <span className="badge badge-ghost ml-auto">{items.length}</span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                    {items.map((field, index) => (
                        <article
                            key={field.id}
                            draggable={!saving}
                            onDragStart={(event) => {
                                event.dataTransfer.setData("text/plain", field.id);
                                event.dataTransfer.effectAllowed = "move";
                            }}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => handleDrop(event, zone, index)}
                            className={`flex cursor-grab items-center gap-3 rounded-md border bg-base-100 px-3 py-2 shadow-xs active:cursor-grabbing ${editingFieldId === field.id ? "border-primary ring-1 ring-primary/30" : "border-base-300"
                                }`}
                        >
                            <GripVertical size={16} className="shrink-0 text-base-content/35" />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2">
                                    <span className="truncate text-sm font-medium">{field.label}</span>
                                    {field.is_required && <span className="text-xs text-error">*</span>}
                                    {field.is_currency && <span className="badge badge-xs badge-outline">Moneda</span>}
                                </div>
                                <p className="truncate text-xs text-base-content/55">
                                    {field.name} · {TYPE_LABELS.get(field.data_type) ?? field.data_type}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs"
                                onClick={() => startEditField(field)}
                                disabled={saving}
                                aria-label={`Editar campo ${field.label}`}
                                title="Editar campo"
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs text-error"
                                onClick={() => void deleteField(field)}
                                disabled={saving}
                                aria-label={`Eliminar campo ${field.label}`}
                                title="Eliminar campo"
                            >
                                <Trash2 size={14} />
                            </button>
                        </article>
                    ))}
                    <p className="mt-auto py-2 text-center text-xs text-base-content/45">
                        {items.length === 0
                            ? "Arrastra un campo aquí"
                            : "Suelta aquí para agregar al final"}
                    </p>
                </div>
            </section>
        );
    };

    const variableSelected = useMemo(() =>
        VARIABLE_GROUPS.flatMap((group) => group.variables).find((variable) => variable.value === draft.name),
    [draft.name]);
    const filteredVariableGroups = useMemo(() => {
        const query = draft.name.trim().toLowerCase();
        return VARIABLE_GROUPS.map((group) => ({
            ...group,
            variables: group.variables.filter((variable) =>
                !query ||
                variable.name.toLowerCase().includes(query) ||
                variable.value.toLowerCase().includes(query) ||
                variable.description.toLowerCase().includes(query),
            ),
        })).filter((group) => group.variables.length > 0);
    }, [draft.name]);
    const filteredVariables = useMemo(
        () => filteredVariableGroups.flatMap((group) => group.variables),
        [filteredVariableGroups],
    );
    const variableIndexes = useMemo(
        () => new Map(filteredVariables.map((variable, index) => [variable.name, index])),
        [filteredVariables],
    );

    const chooseVariable = (variable: DocumentVariable) => {
        updateDraft("name", variable.value);
        const matchingType = DATA_TYPES.find((type) => type.value === variable.type);
        if (matchingType) updateFieldType(matchingType.value);
        setNameSuggestionsOpen(false);
        setActiveSuggestionIndex(0);
    };

    return (
        <div
            onClick={(event) => event.stopPropagation()}
            className="fixed inset-3 z-50 m-auto flex max-h-[94vh] w-[min(96vw,1280px)] flex-col overflow-hidden rounded-xl border border-base-300 bg-base-200 shadow-2xl sm:inset-6"
        >
            <header className="flex shrink-0 items-center gap-3 border-b border-base-300 bg-base-100 px-5 py-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-neutral text-neutral-content">
                    <FileText size={18} />
                </span>
                <div className="min-w-0">
                    <h2 className="truncate font-semibold">Editor de documento</h2>
                    <p className="truncate text-xs text-base-content/60">
                        {documentSelected.name} · {documentSelected.code}
                    </p>
                </div>
                <div className="ml-auto hidden items-center gap-4 text-xs text-base-content/60 sm:flex">
                    <span>Prefijo: <strong className="text-base-content">{documentSelected.numbering_prefix || "Sin prefijo"}</strong></span>
                    <span>Numeración: <strong className="text-base-content">{documentSelected.next_number} – {documentSelected.end_number === -1 ? "Sin límite" : documentSelected.end_number}</strong></span>
                </div>
                <button
                    type="button"
                    className="btn btn-circle btn-ghost btn-sm ml-auto sm:ml-2"
                    onClick={onClose}
                    aria-label="Cerrar editor"
                >
                    <X size={18} />
                </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                <div className="relative grid gap-5 xl:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
                    <aside className="sticky top-0 self-start max-h-[calc(94vh-6rem)] space-y-4 overflow-y-auto pr-1">
                        <form onSubmit={submitField} className="rounded-lg border border-base-300 bg-base-100 p-4">
                            <div className="mb-4 flex items-center gap-2">
                                {editingFieldId ? <Pencil size={16} /> : <Plus size={16} />}
                                <h3 className="text-sm font-semibold">
                                    {editingFieldId ? "Editar campo" : "Crear campo"}
                                </h3>
                            </div>
                            <div className="space-y-3">
                                <label className="relative flex flex-col gap-1">
                                    <span className="text-xs font-medium">Nombre interno / variable</span>
                                    <input
                                        className="input input-sm w-full"
                                        value={draft.name}
                                        onChange={(event) => {
                                            updateDraft("name", event.target.value);
                                            setActiveSuggestionIndex(0);
                                            setNameSuggestionsOpen(true);
                                        }}
                                        onFocus={() => setNameSuggestionsOpen(true)}
                                        onBlur={() => setNameSuggestionsOpen(false)}
                                        onKeyDown={(event) => {
                                            if (event.key === "ArrowDown" && filteredVariables.length > 0) {
                                                event.preventDefault();
                                                setNameSuggestionsOpen(true);
                                                setActiveSuggestionIndex((index) =>
                                                    Math.min(index + 1, filteredVariables.length - 1),
                                                );
                                            } else if (event.key === "ArrowUp" && filteredVariables.length > 0) {
                                                event.preventDefault();
                                                setActiveSuggestionIndex((index) => Math.max(index - 1, 0));
                                            } else if (event.key === "Escape") {
                                                setNameSuggestionsOpen(false);
                                            } else if (
                                                event.key === "Enter" &&
                                                nameSuggestionsOpen &&
                                                filteredVariables[activeSuggestionIndex]
                                            ) {
                                                event.preventDefault();
                                                chooseVariable(filteredVariables[activeSuggestionIndex]);
                                            }
                                        }}
                                        maxLength={100}
                                        placeholder="Escribe para buscar una variable"
                                        autoComplete="off"
                                        role="combobox"
                                        aria-autocomplete="list"
                                        aria-expanded={nameSuggestionsOpen && filteredVariables.length > 0}
                                        aria-controls="document-variable-suggestions"
                                        aria-activedescendant={
                                            nameSuggestionsOpen && filteredVariables[activeSuggestionIndex]
                                                ? `document-variable-${activeSuggestionIndex}`
                                                : undefined
                                        }
                                        disabled={saving}
                                    />
                                    {nameSuggestionsOpen && (
                                        <div
                                            id="document-variable-suggestions"
                                            role="listbox"
                                            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-base-300 bg-base-100 p-1 shadow-lg"
                                        >
                                            {filteredVariables.length > 0 ? filteredVariableGroups.map((group) => (
                                                <div key={group.name}>
                                                    <p className="sticky top-0 border-b border-base-200 bg-base-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-base-content/55">
                                                        {VARIABLE_GROUP_LABELS[group.name] ?? group.name}
                                                    </p>
                                                    {group.variables.map((variable) => {
                                                        const index = variableIndexes.get(variable.name) ?? 0;
                                                        return (
                                                            <button
                                                                id={`document-variable-${index}`}
                                                                key={variable.name}
                                                                type="button"
                                                                role="option"
                                                                aria-selected={activeSuggestionIndex === index}
                                                                className={`flex w-full flex-col items-start rounded px-2 py-2 text-left hover:bg-base-200 ${
                                                                    activeSuggestionIndex === index ? "bg-base-200" : ""
                                                                }`}
                                                                onMouseDown={(event) => event.preventDefault()}
                                                                onMouseEnter={() => setActiveSuggestionIndex(index)}
                                                                onClick={() => chooseVariable(variable)}
                                                            >
                                                                <span className="text-sm font-medium">{variable.description}</span>
                                                                <span className="text-xs text-base-content/55">
                                                                    {variable.name} · {variable.value}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )) : (
                                                <p className="px-2 py-2 text-xs text-base-content/55">
                                                    No hay variables coincidentes; puedes usar un nombre personalizado.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {variableSelected && !nameSuggestionsOpen && (
                                        <span className="text-xs text-base-content/55">{variableSelected.description}</span>
                                    )}
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-medium">Etiqueta</span>
                                    <input
                                        className="input input-sm w-full"
                                        value={draft.label}
                                        onChange={(event) => updateDraft("label", event.target.value)}
                                        maxLength={150}
                                        placeholder="Número de orden"
                                        required
                                        disabled={saving}
                                    />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-medium">Tipo de dato</span>
                                    <select
                                        className="select select-sm w-full"
                                        value={draft.data_type}
                                        onChange={(event) => updateFieldType(event.target.value as DocumentFieldDataType)}
                                        disabled={saving}
                                    >
                                        {DATA_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </label>
                                {draft.data_type === "select" && (
                                    <label className="flex flex-col gap-1">
                                        <span className="text-xs font-medium">Opciones (una por línea)</span>
                                        <textarea
                                            className="textarea textarea-sm w-full"
                                            value={draft.options}
                                            onChange={(event) => updateDraft("options", event.target.value)}
                                            rows={3}
                                            placeholder={"Pendiente\nAprobado\nRechazado"}
                                            disabled={saving}
                                        />
                                    </label>
                                )}
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={draft.is_required}
                                        onChange={(event) => updateDraft("is_required", event.target.checked)}
                                        disabled={saving}
                                    />
                                    Campo obligatorio
                                </label>
                                {["number", "decimal", "currency"].includes(draft.data_type) && (
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={draft.is_currency}
                                            onChange={(event) => updateDraft("is_currency", event.target.checked)}
                                            disabled={saving}
                                        />
                                        Es un valor monetario
                                    </label>
                                )}
                            </div>
                            <div className="mt-4 flex gap-2">
                                {editingFieldId && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={cancelEditField}
                                        disabled={saving}
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button type="submit" className="btn btn-neutral btn-sm flex-1" disabled={saving}>
                                    {saving ? <span className="loading loading-spinner loading-xs" /> : <Check size={15} />}
                                    {editingFieldId ? "Guardar cambios" : "Agregar campo"}
                                </button>
                            </div>
                        </form>

                        <div className="rounded-lg border border-base-300 bg-base-100 p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <Hash size={16} />
                                <h3 className="text-sm font-semibold">Campos configurados</h3>
                                <span className="badge badge-ghost ml-auto">{fields.length}</span>
                            </div>
                            <p className="text-xs leading-relaxed text-base-content/55">
                                Los campos nuevos aparecen en el contenido. Arrástralos a otra zona para cambiar su ubicación.
                            </p>
                        </div>
                    </aside>

                    <main className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <div>
                                <h3 className="font-semibold">Estructura del documento</h3>
                                <p className="text-xs text-base-content/55">Arrastra y suelta los campos para definir su orden.</p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm ml-auto"
                                onClick={() => void load()}
                                disabled={loading || saving}
                            >
                                Actualizar
                            </button>
                            {saving && <span className="loading loading-spinner loading-sm text-neutral" />}
                        </div>

                        {error && (
                            <div className="alert alert-error py-2 text-sm" role="alert">
                                <span>{error}</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex min-h-80 items-center justify-center rounded-lg border border-base-300 bg-base-100">
                                <span className="loading loading-spinner loading-lg" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {renderZone(
                                    "header",
                                    "Encabezado",
                                    "Datos que aparecen al inicio del documento.",
                                    PanelTop,
                                    zones.header,
                                )}
                                {renderZone(
                                    "content",
                                    "Campos · contenido",
                                    "Información principal que completará el usuario.",
                                    FileText,
                                    zones.content,
                                )}
                                {renderZone(
                                    "footer",
                                    "Pie de página",
                                    "Datos que aparecen al final del documento.",
                                    CalendarDays,
                                    zones.footer,
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};
