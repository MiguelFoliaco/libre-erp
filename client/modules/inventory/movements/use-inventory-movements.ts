import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiClient, type InventoryMovementInput, type InventoryMovementRow } from '@/lib/sdk';
import { errorMessage, type PersonOption, type ProductOption, type SupplierRecord, type WarehouseRecord } from '../types';
import type { EntrySource, OperationKind } from './movement-types';

export function useInventoryMovements() {
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [operation, setOperation] = useState<OperationKind>('entry');
  const [source, setSource] = useState<EntrySource>('supplier');
  const [warehouseId, setWarehouseId] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [product, setProduct] = useState<ProductOption | null>(null);
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
      const [warehouseResult, supplierResult, peopleResult, movementResult] = await Promise.all([
        apiClient.list<WarehouseRecord>('warehouses', { limit: 200 }),
        apiClient.list<SupplierRecord>('suppliers', { limit: 200 }),
        apiClient.inventoryPeople(),
        apiClient.inventoryMovements(),
      ]);
      setWarehouses(warehouseResult.items);
      setSuppliers(supplierResult.items);
      setPeople(peopleResult.items);
      setMovements(movementResult.items);
      const activeWarehouses = warehouseResult.items.filter((warehouse) => warehouse.is_active);
      const defaultWarehouseId = activeWarehouses[0]?.id || '';
      setWarehouseId((current) => current || defaultWarehouseId);
      setSourceWarehouseId((current) => current || defaultWarehouseId);
      setDestinationWarehouseId((current) => current || activeWarehouses.find((warehouse) => warehouse.id !== defaultWarehouseId)?.id || '');
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
    setError('');
    if (!product) {
      setError('Selecciona un producto de los resultados de búsqueda.');
      return;
    }

    setSaving(true);
    try {
      if (operation === 'transfer') {
        await apiClient.createInventoryTransfer({
          sourceWarehouseId,
          destinationWarehouseId,
          items: [{ productId: product.id, quantity }],
          notes: notes.trim() || undefined,
        });
      } else {
        const input: InventoryMovementInput = {
          movementType: operation,
          warehouseId,
          productId: product.id,
          quantity,
          notes: notes.trim() || undefined,
        };
        if (operation === 'entry') {
          input.source = source;
          if (source === 'supplier') input.supplierId = supplierId;
        }
        await apiClient.createInventoryMovement(input);
      }
      setProduct(null);
      setQuantity('');
      setNotes('');
      await loadData();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  return {
    warehouses,
    suppliers,
    people,
    movements,
    operation,
    setOperation,
    source,
    setSource,
    warehouseId,
    setWarehouseId,
    sourceWarehouseId,
    setSourceWarehouseId,
    destinationWarehouseId,
    setDestinationWarehouseId,
    product,
    setProduct,
    supplierId,
    setSupplierId,
    quantity,
    setQuantity,
    notes,
    setNotes,
    loading,
    saving,
    error,
    submit,
  };
}