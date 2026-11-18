import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import Papa from "papaparse";
import { useState, type ChangeEvent } from 'react'
import { ApiError, type ProductImportRow, apiClient } from '../../../../lib/sdk';
import { text } from '../../../language'
import { useToast } from '../../../common/toast'
import { useSession } from '../../../auth/hook/store'


export const CSVTableProduct = () => {
    const { user } = useSession();
    const [saving, setSaving] = useState(false);
    const [csvFileName, setCsvFileName] = useState("");
    const [csvRows, setCsvRows] = useState<ProductImportRow[]>([]);
    const [csvError, setCsvError] = useState("");
    const [csvFieldErrors, setCsvFieldErrors] = useState<string[]>([]);
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const { notify } = useToast()

    function downloadTemplate() {
        const values = CSV_HEADERS.map((header) => {
            if (header === "company_id") return csvCell(user?.companyId ?? "");
            if (header === "environment_id") return csvCell(user?.environmentId ?? "");
            return "";
        });
        const content = `${CSV_HEADERS.join(",")}\r\n${values.join(",")}\r\n`;
        const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "libre-erp-products-template.csv";
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function parseFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        setCsvFileName(file?.name ?? "");
        setCsvRows([]);
        setCsvError("");
        setCsvFieldErrors([]);
        setImportErrors([]);
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setCsvError(text("modules.products.csv.fileTooLarge"));
            return;
        }

        try {
            const csv = await file.text();
            const parsed = Papa.parse<Record<string, string>>(csv, {
                header: true,
                skipEmptyLines: "greedy",
                transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
            });
            if (parsed.errors.length > 0) {
                setCsvError(text("modules.products.csv.parseFailed"));
                return;
            }
            const headers = parsed.meta.fields ?? [];
            const unknownHeaders = headers.filter(
                (header) => !CSV_ALLOWED_HEADERS.has(header),
            );
            const requiredHeaders = ["name", "currency_code"].filter(
                (header) => !headers.includes(header),
            );
            const fieldErrors = [
                ...unknownHeaders.map((header) =>
                    text("modules.products.csv.unknownColumn", { column: header || "—" }),
                ),
                ...requiredHeaders.map((header) =>
                    text("modules.products.csv.requiredColumn", { column: header }),
                ),
            ];
            if (fieldErrors.length > 0) {
                setCsvFieldErrors(fieldErrors);
                return;
            }
            if (parsed.data.length < 1) {
                setCsvError(text("modules.products.csv.noRows"));
                return;
            }
            if (parsed.data.length > 500) {
                setCsvError(text("modules.products.csv.tooManyRows"));
                return;
            }
            setCsvRows(
                parsed.data.map((row, index) => ({
                    ...row,
                    row_number: index + 2,
                })),
            );
        } catch (cause) {
            setCsvError(
                cause instanceof Error
                    ? cause.message
                    : text("modules.products.csv.parseFailed"),
            );
        }
    }

    async function importCsv() {
        if (csvRows.length === 0 || saving) return;
        setSaving(true);
        setCsvError("");
        setImportErrors([]);
        try {
            const result = await apiClient.importProducts(csvRows);
            notify(
                "success",
                text("modules.products.csv.imported", { count: result.created }),
            );
            setCsvRows([]);
            setCsvFileName("");
            setCsvError("");
        } catch (cause) {
            const errors = readImportErrors(cause);
            setImportErrors(errors);
            if (errors.length === 0) {
                setCsvError(
                    cause instanceof Error
                        ? cause.message
                        : text("modules.products.csv.importFailed"),
                );
            }
        } finally {
            setSaving(false);
        }
    }


    return (
        <section className="space-y-4 rounded-sm border border-base-300 bg-base-100 p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                    <h1 className="text-lg font-semibold">{text("modules.products.csv.title")}</h1>
                    <p className="mt-1 max-w-2xl text-sm text-base-content/55">{text("modules.products.csv.description")}</p>
                </div>
                <button className="btn btn-outline btn-sm" type="button" onClick={downloadTemplate}>
                    <Download size={15} /> {text("modules.products.csv.downloadTemplate")}
                </button>
            </div>
            <div className="rounded-sm border border-info/20 bg-info/5 p-3 text-xs leading-5 text-base-content/70">
                {text("modules.products.csv.templateNotice")}
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-sm border border-dashed border-base-300 bg-base-200/25 px-4 py-8 text-center transition-colors hover:bg-base-200/50">
                <FileSpreadsheet size={25} className="text-base-content/45" />
                <span className="text-sm font-medium">{csvFileName || text("modules.products.csv.selectFile")}</span>
                <span className="text-xs text-base-content/50">{text("modules.products.csv.fileLimits")}</span>
                <input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => void parseFile(event)} />
            </label>
            {csvError && <p role="alert" className="text-sm text-error">{csvError}</p>}
            {csvFieldErrors.length > 0 && (
                <ul role="alert" className="list-inside list-disc space-y-1 text-sm text-error">
                    {csvFieldErrors.map((error) => <li key={error}>{error}</li>)}
                </ul>
            )}
            {csvRows.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span>{text("modules.products.csv.previewCount", { count: csvRows.length })}</span>
                        <button className="btn btn-primary btn-sm" type="button" disabled={saving} onClick={() => void importCsv()}>
                            {saving ? <span className="loading loading-spinner loading-xs" /> : <Upload size={15} />}
                            {text("modules.products.csv.import")}
                        </button>
                    </div>
                    <div className="overflow-x-auto rounded-sm border border-base-300">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>{text("modules.products.csv.row")}</th>
                                    <th>{text("modules.products.fields.name")}</th>
                                    <th>{text("modules.products.fields.sku")}</th>
                                    <th>{text("modules.products.fields.salePrice")}</th>
                                    <th>{text("modules.products.fields.currencyCode")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {csvRows.slice(0, 15).map((row) => (
                                    <tr key={row.row_number}>
                                        <td>{row.row_number}</td>
                                        <td>{row.name || "—"}</td>
                                        <td>{row.sku || "—"}</td>
                                        <td>{row.sale_price || "0"}</td>
                                        <td>{row.currency_code || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {csvRows.length > 15 && <p className="text-xs text-base-content/50">{text("modules.products.csv.previewRemainder", { count: csvRows.length - 15 })}</p>}
                    {importErrors.length > 0 && (
                        <div role="alert" className="max-h-48 overflow-y-auto rounded-sm border border-error/30 bg-error/5 p-3">
                            <p className="mb-2 text-sm font-semibold text-error">{text("modules.products.csv.validationErrors")}</p>
                            <ul className="list-inside list-disc space-y-1 text-xs text-error">
                                {importErrors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}



export const CSV_HEADERS = [
    "company_id",
    "environment_id",
    "brand_id",
    "brand_name",
    "category_id",
    "category_name",
    "department_id",
    "department_name",
    "sku",
    "barcode",
    "name",
    "description",
    "product_type",
    "cost_price",
    "sale_price",
    "currency_code",
    "unit",
    "metadata",
    "is_active",
];
export const CSV_ALLOWED_HEADERS = new Set(CSV_HEADERS);

export function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}


export function csvCell(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
}



function readImportErrors(cause: unknown): string[] {
    if (!(cause instanceof ApiError) || !isRecord(cause.responseBody)) return [];
    const rows = cause.responseBody.errors;
    if (!Array.isArray(rows)) return [];
    return rows.flatMap((row) => {
        if (!isRecord(row) || typeof row.row_number !== "number" || !Array.isArray(row.errors)) {
            return [];
        }
        const rowNumber = row.row_number;
        return row.errors
            .filter((message): message is string => typeof message === "string")
            .map((message) => text("modules.products.csv.rowError", {
                row: rowNumber,
                message,
            }));
    });
}