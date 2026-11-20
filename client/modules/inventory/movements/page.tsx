import { MovementForm } from './movement-form';
import { MovementHistory } from './movement-history';
import { useInventoryMovements } from './use-inventory-movements';

export function InventoryMovementsPage() {
  const movements = useInventoryMovements();

  return (
    <div className="space-y-6 p-5 sm:p-8">
      <header>
        <p className="text-sm font-medium text-warning">Inventario</p>
        <h1 className="mt-1 text-2xl font-semibold">Movimientos</h1>
        <p className="mt-2 text-sm text-base-content/60">
          Registra ingresos, salidas, ajustes y traslados entre bodegas habilitadas.
        </p>
      </header>

      {movements.error && <p className="alert alert-error py-2 text-sm" role="alert">{movements.error}</p>}

      <MovementForm
        warehouses={movements.warehouses}
        suppliers={movements.suppliers}
        people={movements.people}
        operation={movements.operation}
        setOperation={movements.setOperation}
        source={movements.source}
        setSource={movements.setSource}
        warehouseId={movements.warehouseId}
        setWarehouseId={movements.setWarehouseId}
        sourceWarehouseId={movements.sourceWarehouseId}
        setSourceWarehouseId={movements.setSourceWarehouseId}
        destinationWarehouseId={movements.destinationWarehouseId}
        setDestinationWarehouseId={movements.setDestinationWarehouseId}
        product={movements.product}
        setProduct={movements.setProduct}
        supplierId={movements.supplierId}
        setSupplierId={movements.setSupplierId}
        quantity={movements.quantity}
        setQuantity={movements.setQuantity}
        notes={movements.notes}
        setNotes={movements.setNotes}
        loading={movements.loading}
        saving={movements.saving}
        onSubmit={movements.submit}
      />

      <MovementHistory movements={movements.movements} loading={movements.loading} />
    </div>
  );
}
