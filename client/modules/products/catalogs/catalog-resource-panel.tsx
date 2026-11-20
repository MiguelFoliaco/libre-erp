import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { clsx } from "clsx";
import { apiClient } from "@/lib/sdk";
import { Table } from "@/modules/common/table";
import { useToast } from "@/modules/common/toast";
import { text } from "@/modules/language";
import { CatalogCsvImport } from "./catalog-csv-import";
import {
    EMPTY_FORM,
    loadAll,
    messageFromError,
    resourceLabel,
    type CatalogFormValues,
    type CatalogRecord,
    type CatalogResource,
} from "./catalog-types";

const primaryColor = "bg-linear-to-tr from-blue-500 to-120% to-cyan-400";

export function CatalogResourcePanel({ resource, title }: { resource: CatalogResource; title: string }) {
    const { notify } = useToast();
    const [records, setRecords] = useState<CatalogRecord[]>([]);
    const [values, setValues] = useState<CatalogFormValues>(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadRecords = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setRecords(await loadAll(resource));
        } catch (cause) {
            const message = messageFromError(cause);
            setError(message);
            notify("error", message);
        } finally {
            setLoading(false);
        }
    }, [notify, resource]);

    useEffect(() => {
        void loadRecords();
    }, [loadRecords]);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            await apiClient.create(resource, {
                name: values.name.trim(),
                description: values.description.trim() || null,
                logo_url: values.logoUrl.trim() || null,
            });
            notify("success", text("modules.products.catalogs.created", { resource: title }));
            setValues(EMPTY_FORM);
            await loadRecords();
        } catch (cause) {
            const message = messageFromError(cause);
            setError(message);
            notify("error", message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <section className="rounded-sm border border-base-300 bg-base-100 p-5 shadow-sm">
                <h2 className="text-lg font-semibold">{text("modules.products.catalogs.newRecord", { resource: title.toLowerCase() })}</h2>
                <form className="mt-4 space-y-4" onSubmit={(event) => void submit(event)}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1">
                            <span className="label py-0 text-xs font-medium">{text("modules.products.fields.name")} *</span>
                            <input className="input input-sm w-full bg-base-200/35" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} maxLength={150} required />
                        </label>
                        <label className="space-y-1">
                            <span className="label py-0 text-xs font-medium">{text("modules.products.catalogs.logoUrl")}</span>
                            <input className="input input-sm w-full bg-base-200/35" type="url" value={values.logoUrl} onChange={(event) => setValues((current) => ({ ...current, logoUrl: event.target.value }))} />
                        </label>
                        <label className="space-y-1 sm:col-span-2">
                            <span className="label py-0 text-xs font-medium">{text("modules.products.fields.description")}</span>
                            <textarea className="textarea textarea-sm w-full resize-none bg-base-200/35" value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} rows={2} />
                        </label>
                    </div>
                    {error && <p role="alert" className="text-sm text-error">{error}</p>}
                    <div className="flex justify-end border-t border-base-300 pt-4">
                        <button className={clsx("btn btn-info btn-sm text-white", primaryColor)} type="submit" disabled={saving}>
                            {saving ? <span className="loading loading-spinner loading-xs" /> : <Plus size={15} />}
                            {text("modules.products.catalogs.create", { resource: title.toLowerCase() })}
                        </button>
                    </div>
                </form>
            </section>
            <CatalogCsvImport resource={resource} onImported={loadRecords} />
            <CatalogRecordList resource={resource} records={records} loading={loading} error={error} onRetry={loadRecords} />
        </div>
    );
}

function CatalogRecordList({
    resource,
    records,
    loading,
    error,
    onRetry,
}: {
    resource: CatalogResource;
    records: CatalogRecord[];
    loading: boolean;
    error: string;
    onRetry: () => void;
}) {
    return (
        <section className="rounded-sm border border-base-300 bg-base-100 shadow-sm">
            <h2 className="border-b border-base-300 p-4 text-sm font-semibold">{text("modules.products.catalogs.records", { resource: resourceLabel(resource).toLowerCase() })}</h2>
            {error && records.length === 0 && !loading && (
                <div className="flex items-center justify-between gap-3 p-4">
                    <p role="alert" className="text-sm text-error">{error}</p>
                    <button className="btn btn-sm" type="button" onClick={onRetry}>{text("modules.products.catalogs.retry")}</button>
                </div>
            )}
            <div className="p-4">
                <Table<CatalogRecord>
                    data={records}
                    loading={loading}
                    emptyMessage={text("modules.products.catalogs.empty", { resource: resourceLabel(resource).toLowerCase() })}
                    columns={[
                        { key: "name", label: text("modules.products.fields.name"), className: "min-w-40 font-medium" },
                        { key: "description", label: text("modules.products.fields.description"), className: "min-w-48 font-medium", render: (value) => value ? String(value) : "—" },
                        {
                            key: "is_active",
                            label: text("modules.products.fields.status"),
                            className: 'font-medium',
                            render: (value) => (
                                <span className={clsx("badge badge-xs", value ? "badge-success" : "badge-ghost")}>
                                    {value ? text("modules.products.status.active") : text("modules.products.status.inactive")}
                                </span>
                            ),
                        },
                    ]}
                />
            </div>
        </section>
    );
}
