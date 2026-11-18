import { AnimatePresence, motion } from "motion/react";
import { ArrowDownRight, BriefcaseBusiness, CalendarDays, Fingerprint, Mail, MapPin, Phone, UserRound, X } from "lucide-react";
import type { DocumentTypePeople, People } from "../../../../lib/crm";
import { text } from "../../../language";
import { AddressFields } from "../../../setting/components/address-fields";
import { usePersonForm, type PersonWritePayload } from "./hook";

export function PersonFormModal({
    open,
    person,
    documentTypes,
    saving,
    primaryColor,
    onClose,
    onSave,
}: {
    open: boolean;
    person: People | null;
    documentTypes: DocumentTypePeople[];
    saving: boolean;
    primaryColor: string;
    onClose: () => void;
    onSave: (person: People | null, payload: PersonWritePayload) => Promise<void>;
}) {
    const { values, updateField, updateAddress, submit } = usePersonForm({
        open,
        person,
        documentTypes,
        onSave,
    });
    const editing = person !== null;
    const inputClass = "input input-sm outline-none bg-base-200/35 transition-colors focus:bg-base-100";

    return (
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
                        aria-labelledby="person-form-title"
                        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-sm  bg-base-100 shadow-2xl shadow-slate-950/25"
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 280, damping: 27 }}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="relative overflow-hidden border-b border-base-300 bg-base-100 px-5 py-5 sm:px-8 sm:py-7">
                            <div className={`absolute inset-x-0 top-0 h-1.5 ${primaryColor}`} />
                            <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full bg-emerald-400/10 blur-2xl" />
                            <div className="relative flex items-start gap-4">
                                <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-emerald-900/15 ${primaryColor}`}>
                                    {editing ? <BriefcaseBusiness size={22} /> : <UserRound size={23} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                                        {text("modules.crm.personForm.directory")}
                                    </p>
                                    <h2 id="person-form-title" className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                                        {editing
                                            ? text("modules.crm.personForm.editTitle")
                                            : text("modules.crm.personForm.createTitle")}
                                    </h2>
                                    <p className="mt-1 max-w-xl text-sm text-base-content/60">
                                        {editing
                                            ? text("modules.crm.personForm.editDescription")
                                            : text("modules.crm.personForm.createDescription")}
                                    </p>
                                </div>
                                <button type="button" className="btn btn-circle btn-ghost btn-sm" aria-label={text("modules.crm.personForm.close")} onClick={onClose}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="relative mt-5 flex items-center gap-2 text-xs font-medium text-base-content/55">
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-800">{text("modules.crm.personForm.identityStep")}</span>
                                <ArrowDownRight size={13} />
                                <span>{text("modules.crm.personForm.contactStep")}</span>
                            </div>
                        </div>

                        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
                            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-8">
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
                                            <UserRound size={17} />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold">{text("modules.crm.personForm.personalData")}</h3>
                                            <p className="text-xs text-base-content/55">{text("modules.crm.personForm.personalDataHelp")}</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="form-control">
                                            <span className="label-text text-sm mb-1.5 font-medium">{text("modules.crm.personForm.firstName")} <span className="text-error">*</span></span>
                                            <input autoFocus className={inputClass} maxLength={150} required value={values.first_name} onChange={(event) => updateField("first_name", event.target.value)} />
                                        </label>
                                        <label className="form-control">
                                            <span className="label-text text-sm mb-1.5 font-medium">{text("modules.crm.personForm.middleName")}</span>
                                            <input className={inputClass} maxLength={150} value={values.middle_name} onChange={(event) => updateField("middle_name", event.target.value)} />
                                        </label>
                                        <label className="form-control">
                                            <span className="label-text text-sm mb-1.5 font-medium">{text("modules.crm.personForm.lastName")} <span className="text-error">*</span></span>
                                            <input className={inputClass} maxLength={150} required value={values.last_name} onChange={(event) => updateField("last_name", event.target.value)} />
                                        </label>
                                        <label className="form-control">
                                            <span className="label-text text-sm mb-1.5 font-medium">{text("modules.crm.personForm.secondLastName")}</span>
                                            <input className={inputClass} maxLength={150} value={values.second_last_name} onChange={(event) => updateField("second_last_name", event.target.value)} />
                                        </label>
                                    </div>
                                </section>

                                <section className="space-y-4 border-t border-base-300 pt-5">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                                            <Fingerprint size={17} />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold">{text("modules.crm.personForm.identification")}</h3>
                                            <p className="text-xs text-base-content/55">{text("modules.crm.personForm.identificationHelp")}</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="form-control">
                                            <span className="label-text text-sm mb-1.5 font-medium">{text("modules.crm.personForm.documentType")} <span className="text-error">*</span></span>
                                            <select
                                                className="select select-sm outline-none bg-base-200"
                                                required
                                                value={values.document_types_people_id}
                                                onChange={(event) => updateField("document_types_people_id", event.target.value)}
                                            >
                                                <option value="" disabled>{text("modules.crm.personForm.selectDocumentType")}</option>
                                                {documentTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                            </select>
                                            {documentTypes.length === 0 && <span className="mt-1 text-xs text-error">{text("modules.crm.personForm.noDocumentTypes")}</span>}
                                        </label>
                                        <label className="form-control">
                                            <span className="label-text text-sm mb-1.5 font-medium">{text("modules.crm.personForm.documentNumber")}</span>
                                            <input className={inputClass} maxLength={100} value={values.document_number} onChange={(event) => updateField("document_number", event.target.value)} />
                                        </label>
                                    </div>
                                </section>

                                <section className="space-y-4 border-t border-base-300 pt-5">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700">
                                            <Phone size={17} />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold">{text("modules.crm.personForm.contact")}</h3>
                                            <p className="text-xs text-base-content/55">{text("modules.crm.personForm.contactHelp")}</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="form-control">
                                            <span className="label-text text-sm mb-1.5 flex items-center gap-1.5 font-medium"><Mail size={14} /> {text("modules.crm.personForm.email")}</span>
                                            <input className={inputClass} maxLength={255} type="email" value={values.email} onChange={(event) => updateField("email", event.target.value)} />
                                        </label>
                                        <label className="form-control">
                                            <span className="label-text text-sm mb-1.5 flex items-center gap-1.5 font-medium"><Phone size={14} /> {text("modules.crm.personForm.phone")}</span>
                                            <input className={inputClass} maxLength={50} type="tel" value={values.phone} onChange={(event) => updateField("phone", event.target.value)} />
                                        </label>
                                        <label className="form-control sm:col-span-2">
                                            <span className="label-text text-sm mb-1.5 flex items-center gap-1.5 font-medium"><CalendarDays size={14} /> {text("modules.crm.personForm.birthDate")}</span>
                                            <input className={inputClass} type="date" value={values.birth_date} onChange={(event) => updateField("birth_date", event.target.value)} />
                                        </label>
                                    </div>
                                </section>

                                <section className="space-y-4 border-t border-base-300 pt-5">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700">
                                            <MapPin size={17} />
                                        </span>
                                        <div>
                                            <h3 className="font-semibold">{text("modules.crm.personForm.address")}</h3>
                                            <p className="text-xs text-base-content/55">{text("modules.crm.personForm.addressHelp")}</p>
                                        </div>
                                    </div>
                                    <AddressFields
                                        values={values.address}
                                        onChange={updateAddress}
                                        className="grid gap-4 sm:grid-cols-2"
                                    />
                                </section>
                            </div>

                            <footer className="flex flex-col-reverse gap-2 border-t border-base-300 bg-base-200/35 px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
                                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>{text("modules.crm.personForm.cancel")}</button>
                                <button
                                    type="submit"
                                    className={`btn border-0 text-white shadow-md shadow-emerald-900/15 ${primaryColor}`}
                                    disabled={saving || documentTypes.length === 0}
                                >
                                    {saving ? <span className="loading loading-spinner loading-sm" /> : <UserRound size={16} />}
                                    {editing
                                        ? text("modules.crm.personForm.save")
                                        : text("modules.crm.personForm.create")}
                                </button>
                            </footer>
                        </form>
                    </motion.section>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
