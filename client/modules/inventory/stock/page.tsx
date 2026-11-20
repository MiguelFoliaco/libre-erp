import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { apiClient, type InventoryStockRow } from '@/lib/sdk';
import { errorMessage, type WarehouseRecord } from '../types';

export function InventoryStockPage() {
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [rows, setRows] = useState<InventoryStockRow[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [warehouseResult, stockResult] = await Promise.all([
        apiClient.list<WarehouseRecord>('warehouses', { limit: 200 }),
        apiClient.inventoryStock({
          warehouseId: warehouseId || undefined,
          query: submittedQuery || undefined,
        }),
      ]);
      setWarehouses(warehouseResult.items);
      setRows(stockResult.items);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [submittedQuery, warehouseId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  return (
    <div className="space-y-6 p-5 sm:p-8">
      <header>
        <p className="text-sm font-medium text-warning">Inventario</p>
        <h1 className="mt-1 text-2xl font-semibold">Existencias por bodega</h1>
        <p className="mt-2 text-sm text-base-content/60">
          Consulta unidades en stock, reservadas y disponibles por producto y ubicación.
        </p>
      </header>

      <form className="grid gap-3 rounded-lg border border-base-300 bg-base-100 p-4 sm:grid-cols-[1fr_2fr_auto]" onSubmit={applyFilters}>
        <label className="form-control">
          <span className="label-text mb-1 text-xs">Bodega</span>
          <select className="select select-bordered select-sm" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
            <option value="">Todas las bodegas</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}{warehouse.is_active ? '' : ' (bloqueada)'}</option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <span className="label-text mb-1 text-xs">Producto, SKU o código de barras</span>
          <input className="input input-bordered input-sm" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} placeholder="Buscar producto" />
        </label>
        <div className="flex items-end">
          <button className="btn btn-warning btn-sm w-full sm:w-auto" type="submit">
            <Search size={15} />
            Consultar
          </button>
        </div>
      </form>

      {error && <p className="alert alert-error py-2 text-sm" role="alert">{error}</p>}

      <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
        <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <h2 className="font-semibold">Stock</h2>
          <span className="badge badge-ghost">{rows.length} productos</span>
        </div>
        {loading ? (
          <div className="flex min-h-40 items-center justify-center"><span className="loading loading-spinner loading-md text-warning" /></div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-base-content/60">No hay existencias que coincidan con los filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Bodega</th>
                  <th className="text-right">En stock</th>
                  <th className="text-right">Reservado</th>
                  <th className="text-right">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p className="font-medium">{row.product_name}</p>
                      {row.sku && <p className="text-xs text-base-content/50">SKU: {row.sku}</p>}
                    </td>
                    <td>{row.warehouse_name}</td>
                    <td className="text-right tabular-nums">{row.quantity}</td>
                    <td className="text-right tabular-nums">{row.reserved_quantity}</td>
                    <td className="text-right font-semibold tabular-nums">{row.available_quantity}</td>
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
