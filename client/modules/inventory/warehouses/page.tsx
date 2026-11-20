import { type WarehouseRecord } from '../types';
import { Warehouse } from 'lucide-react';
import { text } from '@/modules/language';
import { clsx } from 'clsx';
import { usePageWarehouse } from './hook';
import { AddressFields } from '@/modules/common/address-fields';
import { Table } from '@/modules/common/table/index';
import { getAddressStr } from '@/modules/common/utils/get-address';
import { truncate } from '@/modules/common/utils/truncate';

const warehouseTypes = [
  { value: 'standard', label: 'General' },
  { value: 'returns', label: 'Devoluciones' },
  { value: 'damaged', label: 'Mercancía dañada' },
  { value: 'transit', label: 'Tránsito' },
] as const;

const primaryColor = 'bg-linear-to-tr from-yellow-500 to-120% to-orange-400';
const primaryColor20 = 'bg-linear-to-tr from-yellow-500/30 to-120% to-orange-400/30';

export function InventoryWarehousesPage() {

  const {
    copy,
    warehouses,
    suppliers,
    supplierSearchResults,
    supplierSearchLoading,
    supplierQuery,
    setSupplierQuery,
    people,
    name,
    code,
    warehouseType,
    personId,
    supplierCode,
    loading,
    saving,
    busyId,
    error,
    createWarehouse,
    createSupplier,
    toggleWarehouse,
    assignedPeople,
    setName,
    setCode,
    setWarehouseType,
    setPersonId,
    setSupplierCode,
    addressValue,
    setAddressValue
  } = usePageWarehouse()

  return (
    <>
      {/* Page header */}
      <header className="flex h-16 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4 lg:px-10">
        <span className={
          clsx(
            "flex size-9 items-center justify-center rounded-sm  ",
            primaryColor20
          )
        }>
          <Warehouse size={19} />
        </span>
        <div>
          <span className="text-sm font-semibold text-base-content/80">{text("modules.inventory.warehouses.title")}</span>
          <p className="text-xs text-base-content/50">{text("modules.inventory.warehouses.description")}</p>
        </div>
      </header>
      <div className="space-y-6 p-5 sm:p-8">
        {error && <p className="alert alert-error py-2 text-sm" role="alert">{error}</p>}

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-base-300 bg-base-100 p-5">
            <h2 className="text-lg font-semibold">Crear bodega</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => void createWarehouse(event)}>
              <label className="flex flex-col">
                <span className="label-text mb-1 text-xs">Nombre *</span>
                <input className="input  input-sm" value={name} onChange={(event) => setName(event.target.value)} maxLength={150} required />
              </label>
              <label className="flex flex-col">
                <span className="label-text mb-1 text-xs">Código</span>
                <input className="input  input-sm" value={code} onChange={(event) => setCode(event.target.value)} maxLength={50} />
              </label>
              <label className="flex flex-col">
                <span className="label-text mb-1 text-xs">Tipo de bodega</span>
                <select className="select select-bordered select-sm" value={warehouseType} onChange={(event) => setWarehouseType(event.target.value as WarehouseRecord['warehouse_type'])}>
                  {warehouseTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <div className="flex flex-col col-span-2">
                <AddressFields
                  values={addressValue}
                  onChange={(key, value) => setAddressValue(state => ({ ...state, [key]: value }))}
                  className="grid gap-4 text-sm! sm:grid-cols-2"
                  labelClassName="text-xs!"
                />
              </div>
              <div className="flex items-end sm:justify-end">
                <button className={
                  clsx(
                    "btn btn-warning btn-sm",
                    primaryColor
                  )
                } type="submit" disabled={saving}>
                  {saving && <span className="loading loading-spinner loading-xs" />}
                  Crear bodega
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-base-300 pt-5">
              <h3 className="font-semibold">Bodegas registradas</h3>
              {loading ? (
                <div className="flex justify-center p-8"><span className="loading loading-spinner loading-md" /></div>
              ) : warehouses.length === 0 ? (
                <p className="py-5 text-sm text-base-content/60">Aún no hay bodegas.</p>
              ) : (
                <Table
                  data={warehouses}
                  columns={[
                    {
                      key: 'code',
                      label: 'Codigo',
                      className: 'font-normal',
                      render: (_, row) => <span className='kbd kbd-xs' onClick={() => copy(row.code ?? '')}>{row.code}</span>
                    },
                    {
                      key: 'name',
                      label: 'Nombre',
                      className: 'font-normal',
                    },
                    {
                      key: 'warehouse_type',
                      label: 'Tipo',
                      className: 'font-normal',
                    },
                    {
                      key: 'address',
                      label: 'Direccion',
                      className: 'font-normal',
                      render: (_, row) => <span title={getAddressStr(row.address)} onClick={() => copy(getAddressStr(row.address))}>{truncate(getAddressStr(row.address), 50)}</span>
                    }
                  ]}
                />
              )}
            </div>
          </section>

          <section className="rounded-lg border border-base-300 bg-base-100 p-5">
            <h2 className="text-lg font-semibold">Registrar proveedor</h2>
            <p className="mt-1 text-sm text-base-content/60">
              Cada proveedor se vincula con una persona existente en este environment.
            </p>
            <form className=" flex flex-col gap-3" onSubmit={(event) => void createSupplier(event)}>
              <label className="flex flex-col">
                <span className="label-text mb-1 text-xs">Persona *</span>
                <select className="select select-bordered select-sm" value={personId} onChange={(event) => setPersonId(event.target.value)} required>
                  <option value="">Selecciona una persona</option>
                  {people.filter((person) => !assignedPeople.has(person.id)).map((person) => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
                {people.length === 0 && <span className="mt-1 text-xs text-base-content/60">Primero registra una persona en el módulo de Personas.</span>}
              </label>
              <label className="flex flex-col mt-3">
                <span className="label-text mb-1 text-xs">Código de proveedor</span>
                <input className="input  input-sm" value={supplierCode} onChange={(event) => setSupplierCode(event.target.value)} maxLength={100} />
              </label>
              <div className="flex items-end sm:justify-end">
                <button className={
                  clsx(
                    "btn btn-warning text-black btn-sm",
                    primaryColor
                  )
                } type="submit" disabled={saving || !personId}>
                  {saving && <span className="loading loading-spinner loading-xs" />}
                  Registrar proveedor
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-base-300 pt-5">
              <h3 className="font-semibold">Proveedores registrados</h3>
              <label className="mt-3 block max-w-md">
                <span className="label-text mb-1 text-xs">Buscar por persona, documento, correo, teléfono o código</span>
                <input
                  className="input input-bordered input-sm w-full"
                  value={supplierQuery}
                  onChange={(event) => setSupplierQuery(event.target.value)}
                  placeholder="Buscar proveedor"
                />
              </label>
              <div className="mt-3">
                <Table
                  data={supplierSearchResults ?? suppliers}
                  loading={loading || supplierSearchLoading}
                  emptyMessage={supplierQuery.trim() ? "No se encontraron proveedores." : "Aún no hay proveedores."}
                  columns={[
                    {
                      key: 'supplier_code',
                      label: 'Código',
                      className: 'font-normal',
                      render: (value) => value
                        ? <span className="kbd kbd-xs cursor-pointer" onClick={() => void copy(String(value))}>{String(value)}</span>
                        : '—'
                    },
                    {
                      key: 'person_name',
                      label: 'Nombre de la persona',
                      className: 'min-w-48 font-medium',
                    },
                    {
                      key: 'document_number',
                      label: 'Documento',
                      className: 'min-w-36',
                      render: (value, row) => [row.document_type_name, value].filter(Boolean).join(' ') || '—',
                    },
                    {
                      key: 'email',
                      label: 'Correo',
                      className: 'min-w-48',
                      render: (value) => String(value ?? '—'),
                    },
                    {
                      key: 'phone',
                      label: 'Teléfono',
                      className: 'min-w-32',
                      render: (value) => String(value ?? '—'),
                    },
                    {
                      key: 'is_active',
                      label: 'Estado',
                      render: (value) => (
                        <span className={clsx('badge badge-sm', value ? 'badge-success' : 'badge-ghost')}>
                          {value ? 'Activo' : 'Inactivo'}
                        </span>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
