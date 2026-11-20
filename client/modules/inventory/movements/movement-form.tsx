import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { PersonOption, ProductOption, SupplierRecord, WarehouseRecord } from '../types';
import { InventoryProductAutocomplete } from '@/modules/common/inventory-product-autocomplete';
import type { EntrySource, OperationKind } from './movement-types';

interface MovementFormProps {
  warehouses: WarehouseRecord[];
  suppliers: SupplierRecord[];
  people: PersonOption[];
  operation: OperationKind;
  setOperation: Dispatch<SetStateAction<OperationKind>>;
  source: EntrySource;
  setSource: Dispatch<SetStateAction<EntrySource>>;
  warehouseId: string;
  setWarehouseId: Dispatch<SetStateAction<string>>;
  sourceWarehouseId: string;
  setSourceWarehouseId: Dispatch<SetStateAction<string>>;
  destinationWarehouseId: string;
  setDestinationWarehouseId: Dispatch<SetStateAction<string>>;
  product: ProductOption | null;
  setProduct: Dispatch<SetStateAction<ProductOption | null>>;
  supplierId: string;
  setSupplierId: Dispatch<SetStateAction<string>>;
  quantity: string;
  setQuantity: Dispatch<SetStateAction<string>>;
  notes: string;
  setNotes: Dispatch<SetStateAction<string>>;
  loading: boolean;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function MovementForm(props: MovementFormProps) {
  const activeWarehouses = props.warehouses.filter((warehouse) => warehouse.is_active);
  const activeSuppliers = props.suppliers.filter((supplier) => supplier.is_active);
  const personNames = new Map(props.people.map((person) => [person.id, person.name]));

  return (
    <section className="rounded-lg border border-base-300 bg-base-100 p-5">
      <h2 className="text-lg font-semibold">Nuevo movimiento</h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" onSubmit={props.onSubmit}>
        <label className="flex flex-col">
          <span className="label-text mb-1 text-xs">Tipo de movimiento</span>
          <select className="select select-bordered select-sm" value={props.operation} onChange={(event) => props.setOperation(event.target.value as OperationKind)}>
            <option value="entry">Entrada</option>
            <option value="exit">Salida</option>
            <option value="adjustment_in">Ajuste de entrada</option>
            <option value="adjustment_out">Ajuste de salida</option>
            <option value="transfer">Traslado entre bodegas</option>
          </select>
        </label>

        {props.operation === 'transfer' ? (
          <>
            <label className="flex flex-col">
              <span className="label-text mb-1 text-xs">Bodega de origen *</span>
              <select className="select select-bordered select-sm" value={props.sourceWarehouseId} onChange={(event) => {
                const nextSource = event.target.value;
                props.setSourceWarehouseId(nextSource);
                if (nextSource === props.destinationWarehouseId) {
                  props.setDestinationWarehouseId(activeWarehouses.find((warehouse) => warehouse.id !== nextSource)?.id || '');
                }
              }} required>
                <option value="">Selecciona bodega</option>
                {activeWarehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="label-text mb-1 text-xs">Bodega de destino *</span>
              <select className="select select-bordered select-sm" value={props.destinationWarehouseId} onChange={(event) => props.setDestinationWarehouseId(event.target.value)} required>
                <option value="">Selecciona bodega</option>
                {activeWarehouses.filter((warehouse) => warehouse.id !== props.sourceWarehouseId).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </label>
          </>
        ) : (
          <label className="flex flex-col">
            <span className="label-text mb-1 text-xs">Bodega *</span>
            <select className="select select-bordered select-sm" value={props.warehouseId} onChange={(event) => props.setWarehouseId(event.target.value)} required>
              <option value="">Selecciona bodega</option>
              {activeWarehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
          </label>
        )}

        <InventoryProductAutocomplete value={props.product} onChange={props.setProduct} disabled={props.loading || props.saving} />
        <label className="flex flex-col">
          <span className="label-text mb-1 text-xs">Cantidad *</span>
          <input className="input input-bordered input-sm" type="number" min="0.000001" step="0.000001" value={props.quantity} onChange={(event) => props.setQuantity(event.target.value)} required />
        </label>

        {props.operation === 'entry' && (
          <>
            <label className="flex flex-col">
              <span className="label-text mb-1 text-xs">Origen del ingreso *</span>
              <select className="select select-bordered select-sm" value={props.source} onChange={(event) => props.setSource(event.target.value as EntrySource)}>
                <option value="supplier">Ingreso de proveedor</option>
                <option value="return">Devolución</option>
              </select>
            </label>
            {props.source === 'supplier' && (
              <label className="flex flex-col">
                <span className="label-text mb-1 text-xs">Proveedor *</span>
                <select className="select select-bordered select-sm" value={props.supplierId} onChange={(event) => props.setSupplierId(event.target.value)} required>
                  <option value="">Selecciona proveedor</option>
                  {activeSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{personNames.get(supplier.person_id) || supplier.supplier_code || 'Proveedor'}</option>)}
                </select>
              </label>
            )}
          </>
        )}

        <label className="flex flex-col col-span-3">
          <span className="label-text mb-1 text-xs">Notas</span>
          <textarea className="textarea w-full resize-none textarea-sm" value={props.notes} onChange={(event) => props.setNotes(event.target.value)} rows={2} maxLength={2000} />
        </label>
        <div className="flex items-center justify-between gap-3 sm:col-span-2 xl:col-span-3">
          <p className="text-xs text-base-content/50">Los cambios de existencias y su historial se guardan juntos.</p>
          <button className="btn btn-warning btn-sm" type="submit" disabled={props.saving || props.loading || activeWarehouses.length === 0 || !props.product || (props.operation === 'transfer' && activeWarehouses.length < 2)}>
            {props.saving && <span className="loading loading-spinner loading-xs" />}
            Registrar movimiento
          </button>
        </div>
      </form>
      {activeWarehouses.length === 0 && <p className="mt-3 text-sm text-warning">Habilita al menos una bodega para registrar movimientos.</p>}
      {props.operation === 'entry' && props.source === 'supplier' && activeSuppliers.length === 0 && <p className="mt-3 text-sm text-warning">Registra un proveedor en la sección Bodegas antes de continuar.</p>}
    </section>
  );
}