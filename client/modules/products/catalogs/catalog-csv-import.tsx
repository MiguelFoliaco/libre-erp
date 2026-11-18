import { useMemo, useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { apiClient } from "../../../lib/sdk";
import { useToast } from "../../common/toast";
import { text } from "../../language";
import { MAX_FILE_SIZE, MAX_ROWS, messageFromError, parseActive, resourceLabel, type CatalogResource, type CsvRow } from "./catalog-types";

export function CatalogCsvImport({ resource, onImported }: { resource: CatalogResource; onImported: () => Promise<void> }) {
    const { notify } = useToast();
    const [fileName, setFileName] = useState("");
    const [rows, setRows] = useState<CsvRow[]>([]);
    const [error, setError] = useState("");
    const [rowErrors, setRowErrors] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const headers = useMemo(() => resource === "categories"
        ? ["name", "description", "logo_url", "parent_id", "is_active", "metadata"]
        : ["name", "description", "logo_url", "is_active", "metadata"], [resource]);

    function downloadTemplate() {
        const url = URL.createObjectURL(new Blob([`${headers.join(",")}\r\n`], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `libre-erp-${resource}-template.csv`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function parseFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        setFileName(file?.name ?? "");
        setRows([]);
        setError("");
        setRowErrors([]);
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            setError(text("modules.products.catalogs.fileTooLarge"));
            return;
        }
        try {
            const parsed = Papa.parse<Record<string, string>>(await file.text(), {
                header: true,
                skipEmptyLines: "greedy",
                transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
            });
            if (parsed.errors.length) {
                setError(text("modules.products.catalogs.parseFailed"));
                return;
            }
            const csvHeaders = parsed.meta.fields ?? [];
            const unknown = csvHeaders.filter((header) => !headers.includes(header));
            const missingName = !csvHeaders.includes("name");
            if (unknown.length || missingName) {
                setError(text("modules.products.catalogs.invalidHeaders", {
                    columns: [...unknown, ...(missingName ? ["name"] : [])].join(", "),
                }));
                return;
            }
            if (!parsed.data.length || parsed.data.length > MAX_ROWS) {
                setError(text("modules.products.catalogs.rowLimit", { count: MAX_ROWS }));
                return;
            }
            const parsedRows: CsvRow[] = [];
            for (const [index, row] of parsed.data.entries()) {
                if (!row.name?.trim()) {
                    setError(text("modules.products.catalogs.missingName", { row: index + 2 }));
                    return;
                }
                if (row.is_active && parseActive(row.is_active) === undefined) {
                    setError(text("modules.products.catalogs.invalidActive", { row: index + 2 }));
                    return;
                }
                if (row.metadata?.trim()) {
                    try {
                        const metadata: unknown = JSON.parse(row.metadata);
                        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error();
                    } catch {
                        setError(text("modules.products.catalogs.invalidMetadata", { row: index + 2 }));
                        return;
                    }
                }
                parsedRows.push({
                    name: row.name.trim(),
                    description: row.description,
                    logo_url: row.logo_url,
                    is_active: row.is_active,
                    parent_id: row.parent_id,
                    metadata: row.metadata,
                    rowNumber: index + 2,
                });
            }
            setRows(parsedRows);
        } catch (cause) {
            setError(messageFromError(cause));
        }
    }

    async function importCsv() {
        if (!rows.length || saving) return;
        setSaving(true);
        setError("");
        setRowErrors([]);
        let created = 0;
        const failures: string[] = [];
        for (const row of rows) {
            try {
                const payload: Record<string, unknown> = {
                    name: row.name.trim(),
                    description: row.description?.trim() || null,
                    logo_url: row.logo_url?.trim() || null,
                    is_active: parseActive(row.is_active) ?? true,
                    metadata: row.metadata?.trim() ? JSON.parse(row.metadata) as Record<string, unknown> : {},
                };
                if (resource === "categories") payload.parent_id = row.parent_id?.trim() || null;
                await apiClient.create(resource, payload);
                created += 1;
            } catch (cause) {
                failures.push(text("modules.products.catalogs.rowError", {
                    row: row.rowNumber,
                    message: messageFromError(cause),
                }));
            }
        }
        setRowErrors(failures);
        if (created > 0) {
            notify("success", text("modules.products.catalogs.imported", { count: created }));
            setRows([]);
            setFileName("");
            await onImported();
        }
        if (failures.length) setError(text("modules.products.catalogs.partialImport", { count: failures.length }));
        setSaving(false);
    }

    return (
        <section className="space-y-4 rounded-sm border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                    <h2 className="text-lg font-semibold">{text("modules.products.catalogs.csvTitle", { resource: resourceLabel(resource).toLowerCase() })}</h2>
                    <p className="mt-1 text-sm text-base-content/55">{text("modules.products.catalogs.csvDescription", { count: MAX_ROWS })}</p>
                </div>
                <button className="btn btn-outline btn-sm" type="button" onClick={downloadTemplate}>
                    <Download size={15} /> {text("modules.products.catalogs.downloadTemplate")}
                </button>
            </div>
            {resource === "categories" && (
                <p className="rounded-sm border border-info/20 bg-info/5 p-3 text-xs text-base-content/70">
                    {text("modules.products.catalogs.parentIdNotice")}
                </p>
            )}
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-sm border border-dashed border-base-300 bg-base-200/25 px-4 py-6 text-center hover:bg-base-200/50">
                <FileSpreadsheet size={24} className="text-base-content/45" />
                <span className="text-sm font-medium">{fileName || text("modules.products.catalogs.selectFile")}</span>
                <span className="text-xs text-base-content/50">{text("modules.products.catalogs.fileLimits", { count: MAX_ROWS })}</span>
                <input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => void parseFile(event)} />
            </label>
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            {rows.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span>{text("modules.products.catalogs.previewCount", { count: rows.length })}</span>
                        <button className="btn btn-primary btn-sm" type="button" disabled={saving} onClick={() => void importCsv()}>
                            {saving ? <span className="loading loading-spinner loading-xs" /> : <Upload size={15} />}
                            {text("modules.products.catalogs.import")}
                        </button>
                    </div>
                    <div className="overflow-x-auto rounded-sm border border-base-300">
                        <table className="table table-sm">
                            <thead><tr><th>{text("modules.products.catalogs.row")}</th><th>{text("modules.products.fields.name")}</th><th>{text("modules.products.fields.description")}</th></tr></thead>
                            <tbody>{rows.slice(0, 15).map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.name}</td><td>{row.description || "—"}</td></tr>)}</tbody>
                        </table>
                    </div>
                    {rowErrors.length > 0 && (
                        <ul role="alert" className="max-h-48 list-inside list-disc space-y-1 overflow-y-auto rounded-sm border border-error/30 bg-error/5 p-3 text-xs text-error">
                            {rowErrors.map((rowError) => <li key={rowError}>{rowError}</li>)}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}
