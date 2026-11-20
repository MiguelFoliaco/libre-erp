import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiClient, type InventoryMovementInput, type InventoryMovementRow } from '@/lib/sdk';
import { errorMessage, type PersonOption, type ProductOption, type SupplierRecord, type WarehouseRecord } from '../types';

type OperationKind = InventoryMovementInput['movementType'] | 'transfer';
type EntrySource = 'supplier' | 'return';

const movementLabels: Record<InventoryMovementRow['movement_type'], string> = {
  entry: 'Entrada',
  exit: 'Salida',
  adjustment_in: 'Ajuste de entrada',
  adjustment_out: 'Ajuste de salida',
  transfer_in: 'Traslado recibido',
  transfer_out: 'Traslado enviado',
  reversal: 'Reversión',
};

function originLabel(movement: InventoryMovementRow): string {
  if (movement.reference_type === 'supplier') {
    return `Proveedor${movement.supplier_name ? `: ${movement.supplier_name}` : ''}`;
  }
  if (movement.reference_type === 'return') return 'Devolución';
  if (movement.reference_type === 'transfer') return 'Traslado entre bodegas';
  return movement.reference_type || 'Manual';
}

export function InventoryMovementsPage() {
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [operation, setOperation] = useState<OperationKind>('entry');
  const [source, setSource] = useState<EntrySource>('supplier');
  const [warehouseId, setWarehouseId] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [warehouseResult, productResult, supplierResult, peopleResult, movementResult] = await Promise.all([
        apiClient.list<WarehouseRecord>('warehouses', { limit: 200 }),
        apiClient.inventoryProducts(),
        apiClient.list<SupplierRecord>('suppliers', { limit: 200 }),
        apiClient.inventoryPeople(),
        apiClient.inventoryMovements(),
      ]);
      setWarehouses(warehouseResult.items);
      setProducts(productResult.items);
      setSuppliers(supplierResult.items);
      setPeople(peopleResult.items);
      setMovements(movementResult.items);
      const activeWarehouses = warehouseResult.items.filter((warehouse) => warehouse.is_active);
      const defaultSourceId = activeWarehouses[0]?.id || '';
      setWarehouseId((current) => current || defaultSourceId);
      setSourceWarehouseId((current) => current || defaultSourceId);
      setDestinationWarehouseId((current) => current || activeWarehouses.find((warehouse) => warehouse.id !== defaultSourceId)?.id || '');
      setProductId((current) => current || productResult.items[0]?.id || '');
      setSupplierId((current) => current || supplierResult.items.find((supplier) => supplier.is_active)?.id || '');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (operation === 'transfer') {
        await apiClient.createInventoryTransfer({
          sourceWarehouseId,
          destinationWarehouseId,
          items: [{ productId, quantity }],
          notes: notes.trim() || undefined,
        });
      } else {
        const input: InventoryMovementInput = {
          movementType: operation,
          warehouseId,
          productId,
          quantity,
          notes: notes.trim() || undefined,
        };
        if (operation === 'entry') {
          input.source = source;
          if (source === 'supplier') input.supplierId = supplierId;
        }
        await apiClient.createInventoryMovement(input);
      }
      setQuantity('');
      setNotes('');
      await loadData();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  const activeWarehouses = warehouses.filter((warehouse) => warehouse.is_active);
  const personNames = new Map(people.map((person) => [person.id, person.name]));
  const activeSuppliers = suppliers.filter((supplier) => supplier.is_active);

  return (
    <div className="space-y-6 p-5 sm:p-8">
      <header>
        <p className="text-sm font-medium text-warning">Inventario</p>
        <h1 className="mt-1 text-2xl font-semibold">Movimientos</h1>
        <p className="mt-2 text-sm text-base-content/60">
          Registra ingresos, salidas, ajustes y traslados entre bodegas habilitadas.
        </p>
      </header>

      {error && <p className="alert alert-error py-2 text-sm" role="alert">{error}</p>}

      <section className="rounded-lg border border-base-300 bg-base-100 p-5">
        <h2 className="text-lg font-semibold">Nuevo movimiento</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" onSubmit={(event) => void submit(event)}>
          <label className="form-control">
            <span className="label-text mb-1 text-xs">Tipo de movimiento</span>
            <select className="select select-bordered select-sm" value={operation} onChange={(event) => setOperation(event.target.value as OperationKind)}>
              <option value="entry">Entrada</option>
              <option value="exit">Salida</option>
              <option value="adjustment_in">Ajuste de entrada</option>
              <option value="adjustment_out">Ajuste de salida</option>
              <option value="transfer">Traslado entre bodegas</option>
            </select>
          </label>

          {operation === 'transfer' ? (
            <>
              <label className="form-control">
                <span className="label-text mb-1 text-xs">Bodega de origen *</span>
                <select className="select select-bordered select-sm" value={sourceWarehouseId} onChange={(event) => {
                  const nextSource = event.target.value;
                  setSourceWarehouseId(nextSource);
                  if (nextSource === destinationWarehouseId) {
                    setDestinationWarehouseId(activeWarehouses.find((warehouse) => warehouse.id !== nextSource)?.id || '');
                  }
                }} required>
                  <option value="">Selecciona bodega</option>
                  {activeWarehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                </select>
              </label>
              <label className="form-control">
                <span className="label-text mb-1 text-xs">Bodega de destino *</span>
                <select className="select select-bordered select-sm" value={destinationWarehouseId} onChange={(event) => setDestinationWarehouseId(event.target.value)} required>
                  <option value="">Selecciona bodega</option>
                  {activeWarehouses.filter((warehouse) => warehouse.id !== sourceWarehouseId).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
                </select>
              </label>
            </>
          ) : (
            <label className="form-control">
              <span className="label-text mb-1 text-xs">Bodega *</span>
              <select className="select select-bordered select-sm" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} required>
                <option value="">Selecciona bodega</option>
                {activeWarehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
              </select>
            </label>
          )}

          <label className="form-control">
            <span className="label-text mb-1 text-xs">Producto *</span>
            <select className="select select-bordered select-sm" value={productId} onChange={(event) => setProductId(event.target.value)} required>
              <option value="">Selecciona producto</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}{product.sku ? ` · ${product.sku}` : ''}</option>)}
            </select>
          </label>
          <label className="form-control">
            <span className="label-text mb-1 text-xs">Cantidad *</span>
            <input className="input input-bordered input-sm" type="number" min="0.000001" step="0.000001" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
          </label>

          {operation === 'entry' && (
            <>
              <label className="form-control">
                <span className="label-text mb-1 text-xs">Origen del ingreso *</span>
                <select className="select select-bordered select-sm" value={source} onChange={(event) => setSource(event.target.value as EntrySource)}>
                  <option value="supplier">Ingreso de proveedor</option>
                  <option value="return">Devolución</option>
                </select>
              </label>
              {source === 'supplier' && (
                <label className="form-control">
                  <span className="label-text mb-1 text-xs">Proveedor *</span>
                  <select className="select select-bordered select-sm" value={supplierId} onChange={(event) => setSupplierId(event.target.value)} required>
                    <option value="">Selecciona proveedor</option>
                    {activeSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{personNames.get(supplier.person_id) || supplier.supplier_code || 'Proveedor'}</option>)}
                  </select>
                </label>
              )}
            </>
          )}

          <label className="form-control sm:col-span-2 xl:col-span-3">
            <span className="label-text mb-1 text-xs">Notas</span>
            <textarea className="textarea textarea-bordered textarea-sm" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} maxLength={2000} />
          </label>
          <div className="flex items-center justify-between gap-3 sm:col-span-2 xl:col-span-3">
            <p className="text-xs text-base-content/50">Los cambios de existencias y su historial se guardan juntos.</p>
            <button className="btn btn-warning btn-sm" type="submit" disabled={saving || loading || activeWarehouses.length === 0 || products.length === 0 || (operation === 'transfer' && activeWarehouses.length < 2)}>
              {saving && <span className="loading loading-spinner loading-xs" />}
              Registrar movimiento
            </button>
          </div>
        </form>
        {activeWarehouses.length === 0 && <p className="mt-3 text-sm text-warning">Habilita al menos una bodega para registrar movimientos.</p>}
        {operation === 'entry' && source === 'supplier' && activeSuppliers.length === 0 && <p className="mt-3 text-sm text-warning">Registra un proveedor en la sección Bodegas antes de continuar.</p>}
      </section>

      <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
        <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <h2 className="font-semibold">Historial de movimientos</h2>
          <span className="badge badge-ghost">{movements.length} registros recientes</span>
        </div>
        {loading ? (
          <div className="flex min-h-40 items-center justify-center"><span className="loading loading-spinner loading-md text-warning" /></div>
        ) : movements.length === 0 ? (
          <p className="p-6 text-sm text-base-content/60">Aún no hay movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Bodega</th>
                  <th>Movimiento / origen</th>
                  <th className="text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="whitespace-nowrap">{new Date(movement.created_at).toLocaleString()}</td>
                    <td>
                      <p className="font-medium">{movement.product_name}</p>
                      {movement.sku && <p className="text-xs text-base-content/50">SKU: {movement.sku}</p>}
                    </td>
                    <td>{movement.warehouse_name}</td>
                    <td>
                      <p>{movementLabels[movement.movement_type]}</p>
                      <p className="text-xs text-base-content/50">{originLabel(movement)}</p>
                      {movement.notes && <p className="max-w-56 truncate text-xs text-base-content/50">{movement.notes}</p>}
                    </td>
                    <td className="text-right tabular-nums">{movement.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
