import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FileText, Plus } from "lucide-react";
import { ApiError, apiClient } from "@/lib/sdk";
import type { DocumentTypePeople } from "@/lib/crm";
import { useToast } from "@/modules/common/toast";
import { text } from "@/modules/language";

const primaryColor = "bg-linear-to-tr from-emerald-500 via-green-500 to-120% to-yellow-400";

function errorMessage(cause: unknown): string {
    return cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : text("modules.crm.documentTypes.loadError");
}

export default function DocumentTypes() {
    const { notify } = useToast();
    const [documentTypes, setDocumentTypes] = useState<DocumentTypePeople[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadDocumentTypes = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await apiClient.list<DocumentTypePeople>("document-types-people", { limit: 200 });
            setDocumentTypes(result.items);
        } catch (cause: unknown) {
            const message = errorMessage(cause);
            setError(message);
            notify("error", message);
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        void loadDocumentTypes();
    }, [loadDocumentTypes]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError(text("modules.crm.common.required"));
            return;
        }

        setSaving(true);
        setError("");
        try {
            const created = await apiClient.create<DocumentTypePeople>("document-types-people", {
                name: trimmedName,
                description: description.trim() || null,
            });
            setDocumentTypes((current) => [...current, created]);
            setName("");
            setDescription("");
            notify("success", text("modules.crm.documentTypes.created"));
        } catch (cause: unknown) {
            const message = errorMessage(cause);
            setError(message);
            notify("error", message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-full bg-base-200/50 pb-8">
            <header className="flex h-19 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4 lg:px-10">
                <span className="flex size-9 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-700">
                    <FileText size={19} />
                </span>
                <div>
                    <h1 className="text-sm font-semibold text-base-content/80">{text("modules.crm.documentTypes.title")}</h1>
                    <p className="text-xs text-base-content/50">{text("modules.crm.documentTypes.description")}</p>
                </div>
            </header>

            <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
                <div className="alert alert-info text-sm">
                    {text("modules.crm.documentTypes.accessNotice")}
                </div>

                <form className="card border border-base-300 bg-base-100 shadow-sm" onSubmit={handleSubmit}>
                    <div className="card-body gap-4">
                        <h2 className="card-title text-base">{text("modules.crm.documentTypes.createTitle")}</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="flex flex-col">
                                <span className="label-text mb-1">{text("modules.crm.documentTypes.name")} *</span>
                                <input
                                    className="input input-sm"
                                    maxLength={50}
                                    required
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                />
                                <span className="mt-1 text-xs text-base-content/55">{text("modules.crm.documentTypes.namePlaceholder")}</span>
                            </label>
                            <label className="flex flex-col">
                                <span className="label-text mb-1">{text("modules.crm.documentTypes.descriptionLabel")}</span>
                                <input
                                    className="input input-sm"
                                    maxLength={150}
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder={text("modules.crm.documentTypes.descriptionPlaceholder")}
                                />
                            </label>
                        </div>
                        {error && <p className="text-sm text-error" role="alert">{error}</p>}
                        <div className="flex justify-end">
                            <button className={`btn btn-sm border-0 text-white ${primaryColor}`} type="submit" disabled={saving}>
                                {saving ? <span className="loading loading-spinner loading-xs" /> : <Plus size={16} />}
                                {text("modules.crm.documentTypes.create")}
                            </button>
                        </div>
                    </div>
                </form>

                <section className="card border border-base-300 bg-base-100 shadow-sm">
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="flex min-h-32 items-center justify-center">
                                <span className="loading loading-spinner loading-lg text-primary" />
                            </div>
                        ) : error && documentTypes.length === 0 ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 p-6">
                                <p className="text-sm text-error" role="alert">{error}</p>
                                <button className="btn btn-sm" type="button" onClick={() => void loadDocumentTypes()}>
                                    {text("modules.crm.documentTypes.retry")}
                                </button>
                            </div>
                        ) : documentTypes.length === 0 ? (
                            <p className="p-6 text-sm text-base-content/60">{text("modules.crm.documentTypes.empty")}</p>
                        ) : (
                            <ul className="divide-y divide-base-300">
                                {documentTypes.map((documentType) => (
                                    <li className="flex items-center gap-3 p-4" key={documentType.id}>
                                        <FileText size={17} className="shrink-0 text-emerald-700" />
                                        <div className="min-w-0">
                                            <p className="font-semibold">{documentType.name}</p>
                                            <p className="text-sm text-base-content/60">
                                                {documentType.description || text("modules.crm.documentTypes.noDescription")}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
