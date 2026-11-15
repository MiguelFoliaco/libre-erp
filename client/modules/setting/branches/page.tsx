import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Store } from "lucide-react";
import { ApiError, apiClient } from "../../../lib/sdk";
import { ToastProvider, useToast } from "../../common/toast";
import { text } from "../../language";

interface BranchRecord {
    id: string;
    name: string;
    code: string | null;
    is_active: boolean;
}

interface BranchFormValues {
    name: string;
    code: string;
    isActive: boolean;
}

const emptyValues: BranchFormValues = { name: "", code: "", isActive: true };

function errorMessage(cause: unknown): string {
    return cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : text("startModule.settings.common.operationFailed");
}

function BranchSettingsContent() {
    const { notify } = useToast();
    const [branches, setBranches] = useState<BranchRecord[]>([]);
    const [values, setValues] = useState<BranchFormValues>(emptyValues);
    const [editing, setEditing] = useState<BranchRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadBranches = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const result = await apiClient.list<BranchRecord>("branches", { limit: 200 });
            setBranches(result.items);
        } catch (cause: unknown) {
            const message = errorMessage(cause);
            setError(message);
            notify("error", message);
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        void loadBranches();
    }, [loadBranches]);

    function startEditing(branch: BranchRecord) {
        setEditing(branch);
        setValues({
            name: branch.name,
            code: branch.code ?? "",
            isActive: branch.is_active,
        });
        setError("");
    }

    function cancelEditing() {
        setEditing(null);
        setValues(emptyValues);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            const payload = {
                name: values.name.trim(),
                code: values.code.trim() || null,
                isActive: values.isActive,
            };
            if (editing) {
                await apiClient.update<BranchRecord>("branches", editing.id, payload);
                notify("success", text("startModule.settings.branches.updated"));
            } else {
                await apiClient.create<BranchRecord>("branches", payload);
                notify("success", text("startModule.settings.branches.created"));
            }
            cancelEditing();
            await loadBranches();
        } catch (cause: unknown) {
            const message = errorMessage(cause);
            setError(message);
            notify("error", message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-full bg-base-200">
            <header className="flex min-h-16 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4">
                <Store size={20} className="text-primary" />
                <div>
                    <h1 className="font-bold">{text("startModule.settings.branches.title")}</h1>
                    <p className="text-xs text-base-content/60">{text("startModule.settings.branches.description")}</p>
                </div>
            </header>
            <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
                <div className="alert alert-info text-sm">
                    {text("startModule.settings.branches.environmentNotice")}
                </div>
                <form className="card border border-base-300 bg-base-100 shadow-sm" onSubmit={handleSubmit}>
                    <div className="card-body gap-4">
                        <h2 className="card-title text-base">
                            {editing
                                ? text("startModule.settings.branches.editTitle")
                                : text("startModule.settings.branches.createTitle")}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="form-control">
                                <span className="label-text mb-1">{text("startModule.settings.branches.name")}</span>
                                <input
                                    className="input input-bordered"
                                    maxLength={150}
                                    required
                                    value={values.name}
                                    onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                                />
                            </label>
                            <label className="form-control">
                                <span className="label-text mb-1">{text("startModule.settings.branches.code")}</span>
                                <input
                                    className="input input-bordered"
                                    maxLength={50}
                                    value={values.code}
                                    onChange={(event) => setValues((current) => ({ ...current, code: event.target.value }))}
                                />
                            </label>
                        </div>
                        {editing && (
                            <label className="flex items-center gap-3">
                                <input
                                    className="toggle toggle-primary"
                                    type="checkbox"
                                    checked={values.isActive}
                                    onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))}
                                />
                                <span>{text("startModule.settings.branches.active")}</span>
                            </label>
                        )}
                        {error && <p className="text-sm text-error" role="alert">{error}</p>}
                        <div className="flex justify-end gap-2">
                            {editing && (
                                <button className="btn btn-ghost" type="button" onClick={cancelEditing}>
                                    {text("startModule.settings.branches.cancel")}
                                </button>
                            )}
                            <button className="btn btn-primary" type="submit" disabled={saving}>
                                {saving ? <span className="loading loading-spinner loading-xs" /> : editing ? <Pencil size={16} /> : <Plus size={16} />}
                                {editing
                                    ? text("startModule.settings.branches.save")
                                    : text("startModule.settings.branches.create")}
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
                        ) : error && branches.length === 0 ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 p-6">
                                <p className="text-sm text-error" role="alert">{error}</p>
                                <button className="btn btn-primary btn-sm" type="button" onClick={() => void loadBranches()}>
                                    {text("startModule.settings.common.retry")}
                                </button>
                            </div>
                        ) : branches.length === 0 ? (
                            <p className="p-6 text-sm text-base-content/60">{text("startModule.settings.branches.noRecords")}</p>
                        ) : (
                            <ul className="divide-y divide-base-300">
                                {branches.map((branch) => (
                                    <li className="flex flex-wrap items-center justify-between gap-3 p-4" key={branch.id}>
                                        <div className="min-w-0">
                                            <p className="font-semibold">{branch.name}</p>
                                            <p className="text-sm text-base-content/60">
                                                {branch.code || "—"} · {branch.is_active
                                                    ? text("startModule.settings.branches.activeStatus")
                                                    : text("startModule.settings.branches.inactiveStatus")}
                                            </p>
                                        </div>
                                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => startEditing(branch)}>
                                            <Pencil size={15} />
                                            {text("startModule.settings.branches.edit")}
                                        </button>
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

export default function BranchSettings() {
    return (
        <ToastProvider>
            <BranchSettingsContent />
        </ToastProvider>
    );
}
