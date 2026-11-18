import { useState, type ReactNode } from "react";
import { Tags } from "lucide-react";
import { clsx } from "clsx";
import { text } from "../../language";
import { CategoryTreePanel } from "./category-tree-panel";
import { CatalogResourcePanel } from "./catalog-resource-panel";
import { resourceLabel, type CatalogResource, type CatalogTab } from "./catalog-types";

export function CatalogManagementPage({ resource }: { resource: CatalogResource }) {
    return <CatalogResourcePanel resource={resource} title={resourceLabel(resource)} />;
}

export function CatalogCategoriesDepartmentsPage() {
    const [tab, setTab] = useState<CatalogTab>("categories");
    const tabs: { id: CatalogTab; label: string }[] = [
        { id: "categories", label: resourceLabel("categories") },
        { id: "departments", label: resourceLabel("departments") },
        { id: "tree", label: text("modules.products.catalogs.categoryTree") },
        { id: "brands", label: resourceLabel("brands") },
    ];

    return (
        <CatalogPageShell
            title={text("modules.products.catalogs.categoriesDepartments")}
            description={text("modules.products.catalogs.categoriesDepartmentsDescription")}
        >
            <div role="tablist" className="tabs tabs-boxed w-fit">
                {tabs.map(({ id, label }) => (
                    <button
                        key={id}
                        role="tab"
                        type="button"
                        aria-selected={tab === id}
                        className={clsx("tab", tab === id && "tab-active")}
                        onClick={() => setTab(id)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {tab === "categories" && <CatalogResourcePanel resource="categories" title={resourceLabel("categories")} />}
            {tab === "brands" && <CatalogResourcePanel resource="brands" title={resourceLabel("brands")} />}
            {tab === "departments" && <CatalogResourcePanel resource="departments" title={resourceLabel("departments")} />}
            {tab === "tree" && <CategoryTreePanel />}
        </CatalogPageShell>
    );
}

function CatalogPageShell({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <div className="min-h-full bg-base-200/50 pb-8">
            <header className="flex h-16 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4 lg:px-10">
                <span className="flex size-9 items-center justify-center rounded-sm bg-blue-500/10 text-blue-700">
                    <Tags size={19} />
                </span>
                <div>
                    <h1 className="text-sm font-semibold text-base-content/80">{title}</h1>
                    <p className="text-xs text-base-content/50">{description}</p>
                </div>
            </header>
            <main className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">{children}</main>
        </div>
    );
}
