import { useCallback, useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { apiClient } from "@/lib/sdk";
import { Table } from "@/modules/common/table";
import { useToast } from "@/modules/common/toast";
import { text } from "@/modules/language";
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
    const categoryDepths = useMemo(() => {
        const depths = new Map<string, number>();
        for (const category of categories) {
            let depth = 0;
            let parentId = category.parent_id;
            const visited = new Set([category.id]);
            while (parentId && byId.has(parentId) && !visited.has(parentId)) {
                visited.add(parentId);
                depth++;
                parentId = byId.get(parentId)?.parent_id ?? undefined;
            }
            depths.set(category.id, depth);
        }
        return depths;
    }, [byId, categories]);
    const orderedCategories = useMemo(() => {
        const ordered: CatalogRecord[] = [];
        const visited = new Set<string>();
        const visitChildren = (parentId: string) => {
            const children = [...(childrenByParent.get(parentId) ?? [])].sort((a, b) => a.name.localeCompare(b.name));
            for (const child of children) {
                if (visited.has(child.id)) continue;
                visited.add(child.id);
                ordered.push(child);
                visitChildren(child.id);
            }
        };
        visitChildren("");
        for (const category of [...categories].sort((a, b) => a.name.localeCompare(b.name))) {
            if (visited.has(category.id)) continue;
            visited.add(category.id);
            ordered.push(category);
            visitChildren(category.id);
        }
        return ordered;
    }, [categories, childrenByParent]);

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

    return (
        <section className="space-y-4 rounded-sm border border-base-300 bg-base-100 p-5 shadow-sm">
            <div>
                <h2 className="text-lg font-semibold">{text("modules.products.catalogs.categoryTree")}</h2>
                <p className="mt-1 text-sm text-base-content/55">{text("modules.products.catalogs.treeDescription")}</p>
            </div>
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            {categories.some((category) => category.parent_id && !byId.has(category.parent_id)) && (
                <p role="alert" className="text-xs text-warning">{text("modules.products.catalogs.orphanCategories")}</p>
            )}
            <Table<CatalogRecord>
                data={orderedCategories}
                loading={loading}
                emptyMessage={text("modules.products.catalogs.empty", { resource: resourceLabel("categories").toLowerCase() })}
                columns={[
                    {
                        key: "name",
                        label: text("modules.products.fields.category"),
                        className: "min-w-48 font-medium",
                        render: (value, category) => (
                            <span className="inline-flex items-center gap-2" style={{ paddingInlineStart: `${(categoryDepths.get(category.id) ?? 0) * 1.25}rem` }}>
                                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                                {String(value ?? "")}
                            </span>
                        ),
                    },
                    {
                        key: "parent_id",
                        label: text("modules.products.catalogs.parent"),
                        className: "min-w-56 font-medium",
                        render: (_, category) => {
                            const unavailable = descendantsOf(category.id);
                            return (
                                <select
                                    className="select select-sm w-full"
                                    aria-label={text("modules.products.catalogs.parentOf", { name: category.name })}
                                    value={parents[category.id] ?? ""}
                                    onChange={(event) => setParents((current) => ({ ...current, [category.id]: event.target.value }))}
                                >
                                    <option value="">{text("modules.products.catalogs.noParent")}</option>
                                    {categories.filter((option) => option.id !== category.id && !unavailable.has(option.id)).sort((a, b) => a.name.localeCompare(b.name)).map((option) => (
                                        <option key={option.id} value={option.id}>{option.name}</option>
                                    ))}
                                </select>
                            );
                        },
                    },
                    {
                        key: "id",
                        label: text("modules.products.catalogs.saveLink"),
                        className: 'font-medium',
                        render: (_, category) => (
                            <button
                                className="btn btn-sm btn-outline"
                                type="button"
                                disabled={savingId === category.id || (parents[category.id] ?? "") === (category.parent_id ?? "")}
                                onClick={() => void saveParent(category)}
                            >
                                {savingId === category.id ? <span className="loading loading-spinner loading-xs" /> : <Check size={15} />}
                                {text("modules.products.catalogs.saveLink")}
                            </button>
                        ),
                    },
                ]}
            />
        </section>
    );
}
