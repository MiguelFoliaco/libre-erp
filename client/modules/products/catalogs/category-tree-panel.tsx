import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { apiClient } from "../../../lib/sdk";
import { useToast } from "../../common/toast";
import { text } from "../../language";
import { loadAll, messageFromError, resourceLabel, type CatalogRecord } from "./catalog-types";

export function CategoryTreePanel() {
    const { notify } = useToast();
    const [categories, setCategories] = useState<CatalogRecord[]>([]);
    const [parents, setParents] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState("");
    const [error, setError] = useState("");

    const loadCategories = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const items = await loadAll("categories");
            setCategories(items);
            setParents(Object.fromEntries(items.map((item) => [item.id, item.parent_id ?? ""])));
        } catch (cause) {
            const message = messageFromError(cause);
            setError(message);
            notify("error", message);
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        void loadCategories();
    }, [loadCategories]);

    const byId = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
    const childrenByParent = useMemo(() => {
        const map = new Map<string, CatalogRecord[]>();
        for (const category of categories) {
            const key = category.parent_id ?? "";
            map.set(key, [...(map.get(key) ?? []), category]);
        }
        return map;
    }, [categories]);

    function descendantsOf(categoryId: string): Set<string> {
        const descendants = new Set<string>();
        const queue = [categoryId];
        while (queue.length) {
            const current = queue.pop()!;
            for (const child of childrenByParent.get(current) ?? []) {
                if (!descendants.has(child.id)) {
                    descendants.add(child.id);
                    queue.push(child.id);
                }
            }
        }
        return descendants;
    }

    async function saveParent(category: CatalogRecord) {
        setSavingId(category.id);
        setError("");
        try {
            const parentId = parents[category.id] || null;
            await apiClient.update("categories", category.id, { parent_id: parentId });
            notify("success", text("modules.products.catalogs.parentUpdated"));
            await loadCategories();
        } catch (cause) {
            const message = messageFromError(cause);
            setError(message);
            notify("error", message);
        } finally {
            setSavingId("");
        }
    }

    function renderTree(parentId: string, level = 0): ReactNode {
        const children = [...(childrenByParent.get(parentId) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
        if (!children.length) return null;
        return (
            <ul className={level ? "ml-5 border-l border-base-300 pl-4" : ""}>
                {children.map((category) => (
                    <li key={category.id} className="py-1">
                        <span className="inline-flex items-center gap-2 rounded px-2 py-1 text-sm">
                            <span className="size-1.5 rounded-full bg-primary" />{category.name}
                        </span>
                        {renderTree(category.id, level + 1)}
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <section className="space-y-4 rounded-sm border border-base-300 bg-base-100 p-5 shadow-sm">
            <div>
                <h2 className="text-lg font-semibold">{text("modules.products.catalogs.categoryTree")}</h2>
                <p className="mt-1 text-sm text-base-content/55">{text("modules.products.catalogs.treeDescription")}</p>
            </div>
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            {loading ? (
                <div className="flex min-h-24 items-center justify-center"><span className="loading loading-spinner loading-md text-primary" /></div>
            ) : categories.length === 0 ? (
                <p className="text-sm text-base-content/60">{text("modules.products.catalogs.empty", { resource: resourceLabel("categories").toLowerCase() })}</p>
            ) : (
                <>
                    <div className="rounded-sm border border-base-300 bg-base-200/20 p-4">
                        <h3 className="mb-2 text-sm font-semibold">{text("modules.products.catalogs.treePreview")}</h3>
                        {renderTree("")}
                        {categories.some((category) => category.parent_id && !byId.has(category.parent_id)) && (
                            <p role="alert" className="mt-2 text-xs text-warning">{text("modules.products.catalogs.orphanCategories")}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">{text("modules.products.catalogs.linkCategories")}</h3>
                        {categories.map((category) => {
                            const unavailable = descendantsOf(category.id);
                            return (
                                <div key={category.id} className="grid gap-2 rounded-sm border border-base-300 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] sm:items-center">
                                    <span className="font-medium">{category.name}</span>
                                    <select className="select select-sm w-full" aria-label={text("modules.products.catalogs.parentOf", { name: category.name })} value={parents[category.id] ?? ""} onChange={(event) => setParents((current) => ({ ...current, [category.id]: event.target.value }))}>
                                        <option value="">{text("modules.products.catalogs.noParent")}</option>
                                        {categories.filter((option) => option.id !== category.id && !unavailable.has(option.id)).sort((a, b) => a.name.localeCompare(b.name)).map((option) => (
                                            <option key={option.id} value={option.id}>{option.name}</option>
                                        ))}
                                    </select>
                                    <button className="btn btn-sm btn-outline" type="button" disabled={savingId === category.id || (parents[category.id] ?? "") === (category.parent_id ?? "")} onClick={() => void saveParent(category)}>
                                        {savingId === category.id ? <span className="loading loading-spinner loading-xs" /> : <Check size={15} />}
                                        {text("modules.products.catalogs.saveLink")}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </section>
    );
}
