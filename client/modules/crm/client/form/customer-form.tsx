import { AnimatePresence, motion } from "motion/react";
import { ArrowDownRight, BriefcaseBusiness, Check, Code, Fingerprint, Plus, Search, UserRound, X } from "lucide-react";
import type { CustomerPerson, CustomerSearchResult, CustomerType, DocumentTypePeople } from "@/lib/crm";
import { text } from "@/modules/language";
import { PersonFormModal } from "@/modules/crm/peoples/form/create-person";
import type { PersonWritePayload } from "@/modules/crm/peoples/form/hook";
import { useCustomerForm, type CustomerWritePayload } from "./hook";

export function CustomerFormModal({
    open,
    client,
    customerTypes,
    documentTypes,
    saving,
    primaryColor,
    onClose,
    onSave,
}: {
    open: boolean;
    client: CustomerSearchResult | null;
    customerTypes: CustomerType[];
    documentTypes: DocumentTypePeople[];
    saving: boolean;
    primaryColor: string;
    onClose: () => void;
    onSave: (
        client: CustomerSearchResult | null,
        payload: CustomerWritePayload,
        person: CustomerPerson | null,
        newPerson: PersonWritePayload | null,
    ) => Promise<void>;
}) {
    const form = useCustomerForm({ open, client, customerTypes, onSave });
    const editing = client !== null;
    const inputClass = "input input-sm bg-base-200/35 transition-colors focus:bg-base-100";
    const draftName = form.newPerson
        ? [form.newPerson.first_name, form.newPerson.middle_name, form.newPerson.last_name, form.newPerson.second_last_name]
            .filter(Boolean)
            .join(" ")
        : "";


    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) onClose();
                        }}
                    >
                        <motion.section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="customer-form-title"
                            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-sm   bg-base-100 shadow-2xl shadow-slate-950/25"
                            initial={{ opacity: 0, y: 24, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 280, damping: 27 }}
                            onMouseDown={(event) => event.stopPropagation()}
                        >
                            <div className="relative overflow-hidden border-b border-base-300 bg-base-100 px-5 py-5 ">
                                <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full bg-emerald-400/10 blur-2xl" />
                                <div className="relative flex items-start gap-4">
                                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-sm text-white  ${primaryColor}`}>
                                        <BriefcaseBusiness size={22} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">{text("modules.crm.clientForm.section")}</p>
                                        <h2 id="customer-form-title" className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl opacity-90">
                                            {editing
                                                ? text("modules.crm.clientForm.editTitle")
                                                : text("modules.crm.clientForm.createTitle")}
                                        </h2>
                                        <p className="mt-1 max-w-xl text-sm text-base-content/60">
                                            {editing
                                                ? text("modules.crm.clientForm.editDescription")
                                                : text("modules.crm.clientForm.createDescription")}
                                        </p>
                                    </div>
                                    <button type="button" className="btn btn-circle btn-ghost btn-sm" aria-label={text("modules.crm.clientForm.close")} onClick={onClose}>
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="relative mt-5 flex items-center gap-2 text-xs font-medium text-base-content/55">
                                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-800">{text("modules.crm.clientForm.personStep")}</span>
                                    <ArrowDownRight size={13} />
                                    <span>{text("modules.crm.clientForm.accountStep")}</span>
                                </div>
                            </div>

                            <form className="flex min-h-0 flex-1 flex-col" onSubmit={form.submit}>
                                <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-8">
                                    <section className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-9 items-center justify-center rounded-sm bg-sky-500/10 text-sky-700"><UserRound size={17} /></span>
                                            <div>
                                                <h3 className="font-semibold">{text("modules.crm.clientForm.linkedPerson")}</h3>
                                                <p className="text-xs text-base-content/55">{text("modules.crm.clientForm.linkedPersonHelp")}</p>
                                            </div>
                                        </div>

                                        {form.selectedPerson ? (
                                            <div className="flex flex-wrap items-center gap-3 rounded-sm border border-emerald-700/20 bg-emerald-500/5 p-4">
                                                <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-800">
                                                    <UserRound size={20} />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold">
                                                        {[form.selectedPerson.first_name, form.selectedPerson.middle_name, form.selectedPerson.last_name, form.selectedPerson.second_last_name].filter(Boolean).join(" ")}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-xs text-base-content/55">
                                                        {form.selectedPerson.document_number || text("modules.crm.clientForm.noDocument")}{form.selectedPerson.email ? ` · ${form.selectedPerson.email}` : ""}
                                                    </p>
                                                </div>
                                                <span className="badge badge-success badge-outline gap-1"><Check size={12} /> {text("modules.crm.clientForm.linked")}</span>
                                                {!editing && <button className="btn btn-ghost btn-xs" type="button" onClick={form.clearPerson}>{text("modules.crm.clientForm.change")}</button>}
                                            </div>
                                        ) : form.newPerson ? (
                                            <div className="flex flex-wrap items-center gap-3 rounded-sm border border-emerald-700/20 bg-emerald-500/5 p-4">
                                                <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-emerald-500/10 text-emerald-800"><UserRound size={20} /></span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-semibold">{draftName}</p>
                                                    <p className="mt-0.5 truncate text-xs text-base-content/55">
                                                        {form.newPerson.document_number || text("modules.crm.clientForm.noDocument")} · {text("modules.crm.clientForm.newPersonCreatedWithClient")}
                                                    </p>
                                                </div>
                                                <span className="badge badge-success badge-outline gap-1"><Check size={12} /> {text("modules.crm.clientForm.newPerson")}</span>
                                                <button className="btn btn-ghost btn-xs" type="button" onClick={form.clearPerson}>{text("modules.crm.clientForm.change")}</button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 rounded-sm border border-base-300 bg-base-200/25 p-4">
                                                <div className="join w-full" role="search">
                                                    <label className="input outline-none focus-within:border-primary input-sm join-item flex min-w-0 flex-1 items-center gap-2 border-base-300 bg-base-100">
                                                        <Search size={15} className="shrink-0 text-base-content/45" />
                                                        <input
                                                            value={form.personQuery}
                                                            onChange={(event) => form.setPersonQuery(event.target.value)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === "Enter") {
                                                                    event.preventDefault();
                                                                    void form.searchPeople();
                                                                }
                                                            }}
                                                            placeholder={text("modules.crm.clientForm.searchPersonPlaceholder")}
                                                            aria-label={text("modules.crm.clientForm.searchPersonAriaLabel")}
                                                        />
                                                    </label>
                                                    <button className="btn btn-sm join-item" type="button" onClick={() => void form.searchPeople()} disabled={form.searchingPeople}>
                                                        {form.searchingPeople ? <span className="loading loading-spinner loading-xs" /> : <Search size={15} />}
                                                    </button>
                                                </div>

                                                {form.peopleMatches.length > 0 && (
                                                    <ul className="max-h-44 divide-y divide-base-300 overflow-y-auto rounded-sm border border-base-300 bg-base-100">
                                                        {form.peopleMatches.map((person) => (
                                                            <li key={person.id}>
                                                                <button
                                                                    type="button"
                                                                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-emerald-500/5"
                                                                    onClick={() => void form.choosePerson(person)}
                                                                    disabled={form.searchingPeople}
                                                                >
                                                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-base-200 text-base-content/60"><UserRound size={16} /></span>
                                                                    <span className="min-w-0 flex-1">
                                                                        <span className="block truncate text-sm font-semibold">{[person.first_name, person.middle_name, person.last_name, person.second_last_name].filter(Boolean).join(" ")}</span>
                                                                        <span className="block truncate text-xs text-base-content/55">{person.document_number || text("modules.crm.clientForm.noDocument")}{person.email ? ` · ${person.email}` : ""}</span>
                                                                    </span>
                                                                    <Fingerprint size={15} className="text-base-content/35" />
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                <div className="flex flex-col gap-2 border-t border-base-300 pt-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <p className="text-xs text-base-content/55">{text("modules.crm.clientForm.noPersonInDirectory")}</p>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline btn-sm border-emerald-700/30 text-emerald-800 hover:border-emerald-700 hover:bg-emerald-700 hover:text-white"
                                                        onClick={() => form.setPersonModalOpen(true)}
                                                        disabled={documentTypes.length === 0}
                                                    >
                                                        <Plus size={15} /> {text("modules.crm.clientForm.createPerson")}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    <section className="space-y-4 border-t border-base-300 pt-5">
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-9 items-center justify-center rounded-sm bg-amber-500/10 text-amber-700"><BriefcaseBusiness size={17} /></span>
                                            <div>
                                                <h3 className="font-semibold">{text("modules.crm.clientForm.accountConditions")}</h3>
                                                <p className="text-xs text-base-content/55">{text("modules.crm.clientForm.accountConditionsHelp")}</p>
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <label className="flex flex-col">
                                                <span className="label-text text-sm  mb-1.5 font-medium">{text("modules.crm.clientForm.customerType")} <span className="text-error">*</span></span>
                                                <select
                                                    className="select outline-none select-sm "
                                                    required
                                                    value={form.values.customer_type_id}
                                                    onChange={(event) => form.updateField("customer_type_id", event.target.value)}
                                                >
                                                    <option value="" disabled>{text("modules.crm.clientForm.selectCustomerType")}</option>
                                                    {customerTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                                </select>
                                                {customerTypes.length === 0 && <span className="mt-1 text-xs text-error">{text("modules.crm.clientForm.noCustomerTypes")}</span>}
                                            </label>
                                            <label className="form-control flex flex-col">
                                                <span className="label-text text-sm  mb-1.5 font-medium">{text("modules.crm.clientForm.customerCode")}</span>
                                                <div className='join join-sm w-11/12'>
                                                    <input className={inputClass} maxLength={100} placeholder={text("modules.crm.clientForm.codeAssignedLater")} value={form.values.customer_code} onChange={(event) => form.updateField("customer_code", event.target.value)} />
                                                    <div className="tooltip" data-tip={text("modules.crm.clientForm.generateCode")}>
                                                        <button type="button" className="btn btn-square border border-l-0 border-neutral-500/50 btn-sm" onClick={() => form.generateCodeClient()}><Code size={15} /></button>
                                                    </div>
                                                </div>
                                            </label>
                                            <label className="form-control">
                                                <span className="label-text text-sm  mb-1.5 font-medium">{text("modules.crm.clientForm.creditLimit")}</span>
                                                <input className={inputClass} min="0" step="0.01" type="number" value={form.values.credit_limit} onChange={(event) => form.updateField("credit_limit", event.target.value)} />
                                            </label>
                                            <label className="form-control">
                                                <span className="label-text text-sm  mb-1.5 font-medium">{text("modules.crm.clientForm.paymentTerms")}</span>
                                                <input className={inputClass} min="0" step="1" type="number" value={form.values.payment_terms_days} onChange={(event) => form.updateField("payment_terms_days", event.target.value)} />
                                            </label>
                                        </div>
                                    </section>
                                </div>

                                <footer className="flex flex-col-reverse gap-2 border-t border-base-300 bg-base-200/35 px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
                                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>{text("modules.crm.clientForm.cancel")}</button>
                                    <button
                                        type="submit"
                                        className={`btn border-0 text-white  ${primaryColor}`}
                                        disabled={saving || customerTypes.length === 0}
                                    >
                                        {saving ? <span className="loading loading-spinner loading-sm" /> : <BriefcaseBusiness size={16} />}
                                        {editing
                                            ? text("modules.crm.clientForm.save")
                                            : text("modules.crm.clientForm.create")}
                                    </button>
                                </footer>
                            </form>
                        </motion.section>
                    </motion.div>
                )}
            </AnimatePresence>

            <PersonFormModal
                open={form.personModalOpen}
                person={null}
                documentTypes={documentTypes}
                saving={false}
                primaryColor={primaryColor}
                onClose={() => form.setPersonModalOpen(false)}
                onSave={form.stageNewPerson}
            />
        </>
    );
}
