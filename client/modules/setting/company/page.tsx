import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Building, Save } from "lucide-react";
import { ApiError, apiClient } from "../../../lib/sdk";
import { ToastProvider, useToast } from "../../common/toast";
import { text } from "../../language";
import { useSession } from "../../auth/hook/store";

interface CompanyRecord {
    id: string;
    legal_name: string;
    trade_name: string | null;
    registration_number: string | null;
    registration_type: string | null;
    country_code: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    address_str: string | null;
}

type CompanyFormValues = {
    [Field in Exclude<keyof CompanyRecord, "id">]: string;
};

const emptyValues: CompanyFormValues = {
    legal_name: "",
    trade_name: "",
    registration_number: "",
    registration_type: "",
    country_code: "",
    email: "",
    phone: "",
    website: "",
    address_str: "",
};

function errorMessage(cause: unknown): string {
    return cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : text("startModule.settings.common.operationFailed");
}

function CompanySettingsContent() {
    const { notify } = useToast();
    const { user } = useSession();
    const [company, setCompany] = useState<CompanyRecord | null>(null);
    const [values, setValues] = useState<CompanyFormValues>(emptyValues);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadCompany = useCallback(async () => {
        setLoading(true);
        console.log("User data:", user);
        setError("");
        try {
            if(!user) {
                throw new Error("User does not have a company ID");
            }
            console.log("User company ID:", user.companyId);
            const record = await apiClient.get<CompanyRecord>("companies", user.companyId);
            setCompany(record);
            setValues({
                legal_name: record.legal_name ?? "",
                trade_name: record.trade_name ?? "",
                registration_number: record.registration_number ?? "",
                registration_type: record.registration_type ?? "",
                country_code: record.country_code ?? "",
                email: record.email ?? "",
                phone: record.phone ?? "",
                website: record.website ?? "",
                address_str: record.address_str ?? "",
            });
        } catch (cause: unknown) {
            const message = errorMessage(cause);
            setError(message);
            notify("error", message);
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        void loadCompany();
    }, [loadCompany]);

    function updateValue(field: keyof CompanyFormValues, value: string) {
        setValues((current) => ({ ...current, [field]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!company) return;
        setSaving(true);
        setError("");
        try {
            const updated = await apiClient.update<CompanyRecord>(
                "companies",
                company.id,
                {
                    legalName: values.legal_name.trim(),
                    tradeName: values.trade_name.trim() || null,
                    registrationNumber: values.registration_number.trim() || null,
                    registrationType: values.registration_type.trim() || null,
                    countryCode: values.country_code.trim().toUpperCase() || null,
                    email: values.email.trim() || null,
                    phone: values.phone.trim() || null,
                    website: values.website.trim() || null,
                    addressStr: values.address_str.trim() || null,
                },
            );
            setCompany(updated);
            notify("success", text("startModule.settings.company.saved"));
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
            <header className="flex h-16 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4">
                <Building size={20} className="text-neutral" />
                <div>
                    <h1 className="font-bold">{text("startModule.settings.company.title")}</h1>
                    <p className="text-xs text-base-content/60">{text("startModule.settings.company.description")}</p>
                </div>
            </header>
            <main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
                <div className="alert alert-info text-sm">
                    {text("startModule.settings.company.oneCompanyNotice")}
                </div>
                {loading ? (
                    <div className="flex min-h-40 items-center justify-center">
                        <span className="loading loading-spinner loading-lg text-primary" />
                        <span className="sr-only">{text("startModule.settings.common.loading")}</span>
                    </div>
                ) : error && !company ? (
                    <section className="card border border-base-300 bg-base-100">
                        <div className="card-body items-start">
                            <p role="alert">{error}</p>
                            <button className="btn btn-primary btn-sm" type="button" onClick={() => void loadCompany()}>
                                {text("startModule.settings.common.retry")}
                            </button>
                        </div>
                    </section>
                ) : (
                    <form className="card border border-base-300 bg-base-100 shadow-sm" onSubmit={handleSubmit}>
                        <div className="card-body gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="form-control sm:col-span-2">
                                    <span className="label-text mb-1">{text("startModule.settings.company.legalName")}</span>
                                    <input className="input input-bordered" maxLength={255} required value={values.legal_name} onChange={(event) => updateValue("legal_name", event.target.value)} />
                                </label>
                                <label className="form-control">
                                    <span className="label-text mb-1">{text("startModule.settings.company.tradeName")}</span>
                                    <input className="input input-bordered" maxLength={255} value={values.trade_name} onChange={(event) => updateValue("trade_name", event.target.value)} />
                                </label>
                                <label className="form-control">
                                    <span className="label-text mb-1">{text("startModule.settings.company.registrationType")}</span>
                                    <input className="input input-bordered" maxLength={100} value={values.registration_type} onChange={(event) => updateValue("registration_type", event.target.value)} />
                                </label>
                                <label className="form-control">
                                    <span className="label-text mb-1">{text("startModule.settings.company.registrationNumber")}</span>
                                    <input className="input input-bordered" maxLength={100} value={values.registration_number} onChange={(event) => updateValue("registration_number", event.target.value)} />
                                </label>
                                <label className="form-control">
                                    <span className="label-text mb-1">{text("startModule.settings.company.countryCode")}</span>
                                    <input className="input input-bordered" maxLength={2} pattern="[A-Za-z]{2}" value={values.country_code} onChange={(event) => updateValue("country_code", event.target.value)} />
                                </label>
                                <label className="form-control">
                                    <span className="label-text mb-1">{text("startModule.settings.company.email")}</span>
                                    <input className="input input-bordered" type="email" maxLength={255} value={values.email} onChange={(event) => updateValue("email", event.target.value)} />
                                </label>
                                <label className="form-control">
                                    <span className="label-text mb-1">{text("startModule.settings.company.phone")}</span>
                                    <input className="input input-bordered" type="tel" maxLength={50} value={values.phone} onChange={(event) => updateValue("phone", event.target.value)} />
                                </label>
                                <label className="form-control">
                                    <span className="label-text mb-1">{text("startModule.settings.company.website")}</span>
                                    <input className="input input-bordered" type="url" maxLength={500} value={values.website} onChange={(event) => updateValue("website", event.target.value)} />
                                </label>
                                <label className="form-control sm:col-span-2">
                                    <span className="label-text mb-1">{text("startModule.settings.company.address")}</span>
                                    <input className="input input-bordered" maxLength={255} value={values.address_str} onChange={(event) => updateValue("address_str", event.target.value)} />
                                </label>
                            </div>
                            {error && <p className="text-sm text-error" role="alert">{error}</p>}
                            <div className="flex justify-end">
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {saving ? <span className="loading loading-spinner loading-xs" /> : <Save size={16} />}
                                    {text("startModule.settings.company.save")}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}

export default function CompanySettings() {
    return (
        <ToastProvider>
            <CompanySettingsContent />
        </ToastProvider>
    );
}
