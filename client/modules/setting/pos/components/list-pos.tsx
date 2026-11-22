import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { ApiError, apiClient } from '@/lib/sdk';
import type { POSRegister } from '@/lib/sdk';
import { useToast } from '@/modules/common/toast';
import { text } from '@/modules/language';

interface OptionRecord {
    id: string;
    name: string;
}

interface RegisterForm {
    name: string;
    code: string;
    branchId: string;
    warehouseId: string;
    incomeLimit: string;
    isActive: boolean;
}

const emptyForm: RegisterForm = {
    name: '',
    code: '',
    branchId: '',
    warehouseId: '',
    incomeLimit: '',
    isActive: true,
};

function errorMessage(cause: unknown): string {
    return cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : text('modules.settings.common.operationFailed');
}

export const ListPOS = () => {
    const [registers, setRegisters] = useState<POSRegister[]>([]);
    const [branches, setBranches] = useState<OptionRecord[]>([]);
    const [warehouses, setWarehouses] = useState<OptionRecord[]>([]);
    const [form, setForm] = useState<RegisterForm>(emptyForm);
    const [editing, setEditing] = useState<POSRegister | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { notify } = useToast();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [registerResult, branchResult, warehouseResult] = await Promise.all([
                apiClient.posRegisters(),
                apiClient.list<OptionRecord>('branches', { limit: 200 }),
                apiClient.list<OptionRecord>('warehouses', { limit: 200 }),
            ]);
            setRegisters(registerResult.items);
            setBranches(branchResult.items);
            setWarehouses(warehouseResult.items);
        } catch (cause: unknown) {
            notify('error', errorMessage(cause));
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        void load();
    }, [load]);

    function edit(register: POSRegister) {
        setEditing(register);
        setForm({
            name: register.name,
            code: register.code,
            branchId: register.branch_id ?? '',
            warehouseId: register.warehouse_id,
            incomeLimit:
                typeof register.metadata?.income_limit === 'number'
                    ? String(register.metadata.income_limit)
                    : typeof register.metadata?.income_limit === 'string'
                        ? register.metadata.income_limit
                        : '',
            isActive: register.is_active,
        });
    }

    function reset() {
        setEditing(null);
        setForm(emptyForm);
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        try {
            const incomeLimit = form.incomeLimit.trim()
                ? Number(form.incomeLimit)
                : null;
            if (incomeLimit !== null && (!Number.isFinite(incomeLimit) || incomeLimit < 0)) {
                throw new Error(text('modules.settings.common.operationFailed'));
            }
            const payload = {
                name: form.name.trim(),
                code: form.code.trim(),
                branchId: form.branchId || null,
                warehouseId: form.warehouseId,
                isActive: form.isActive,
                metadata: {
                    ...(editing?.metadata ?? {}),
                    income_limit: incomeLimit,
                    limit_warning: true,
                },
            };
            if (editing) {
                await apiClient.update('cash-registers', editing.id, payload);
                notify('success', text('modules.settings.pos.updated'));
            } else {
                await apiClient.create('cash-registers', payload);
                notify('success', text('modules.settings.pos.created'));
            }
            reset();
            await load();
        } catch (cause: unknown) {
            notify('error', errorMessage(cause));
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
            <form className="card border border-base-300 bg-base-100 shadow-sm" onSubmit={submit}>
                <div className="card-body gap-4">
                    <h2 className="card-title text-base">
                        {editing ? text('modules.settings.pos.edit') : text('modules.settings.pos.create')}
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1">
                            <span className="label-text">{text('modules.settings.pos.registerName')}</span>
                            <input className="input" required maxLength={150} value={form.name}
                                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="label-text">{text('modules.settings.pos.code')}</span>
                            <input className="input" required maxLength={50} value={form.code}
                                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="label-text">{text('modules.settings.pos.branch')}</span>
                            <select className="select" value={form.branchId}
                                onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))}>
                                <option value="">-</option>
                                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="label-text">{text('modules.settings.pos.warehouse')}</span>
                            <select className="select" required value={form.warehouseId}
                                onChange={(event) => setForm((current) => ({ ...current, warehouseId: event.target.value }))}>
                                <option value="">-</option>
                                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="label-text">{text('modules.settings.pos.incomeLimit')}</span>
                            <input className="input" type="number" min="0" step="0.01" value={form.incomeLimit}
                                onChange={(event) => setForm((current) => ({ ...current, incomeLimit: event.target.value }))} />
                        </label>
                        {editing && (
                            <label className="flex items-center gap-3 pt-7">
                                <input className="toggle toggle-neutral" type="checkbox" checked={form.isActive}
                                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                                <span>{text('modules.settings.pos.active')}</span>
                            </label>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        {editing && <button type="button" className="btn btn-ghost" onClick={reset}>{text('modules.settings.branches.cancel')}</button>}
                        <button type="submit" className="btn btn-neutral" disabled={saving}>
                            {editing ? <Pencil size={16} /> : <Plus size={16} />}
                            {editing ? text('modules.settings.pos.save') : text('modules.settings.pos.create')}
                        </button>
                    </div>
                </div>
            </form>

            {loading ? (
                <div className="skeleton h-40" />
            ) : registers.length === 0 ? (
                <div className="alert">{text('modules.settings.pos.noRegisters')}</div>
            ) : (
                <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
                    <table className="table">
                        <thead><tr><th>{text('modules.settings.pos.code')}</th><th>{text('modules.settings.pos.registerName')}</th><th>{text('modules.settings.pos.warehouse')}</th><th>{text('modules.settings.pos.branch')}</th><th></th></tr></thead>
                        <tbody>{registers.map((register) => (
                            <tr key={register.id}>
                                <td><code>{register.code}</code></td>
                                <td>{register.name}</td>
                                <td>{register.warehouse_name}</td>
                                <td>{register.branch_name ?? '-'}</td>
                                <td><button className="btn btn-sm" onClick={() => edit(register)}><Pencil size={14} />{text('modules.settings.pos.edit')}</button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </main>
    );
};
