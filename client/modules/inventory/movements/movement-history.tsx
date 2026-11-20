import type { InventoryMovementRow } from '@/lib/sdk';
import { Table } from '@/modules/common/table/index';
import { format } from '@formkit/tempo';
import { useToast } from '@/modules/common/toast';
import { div } from 'motion/react-client';

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

interface MovementHistoryProps {
    movements: InventoryMovementRow[];
    loading: boolean;
}

export function MovementHistory({ movements, loading }: MovementHistoryProps) {

    const { notify } = useToast()

    const copy = async (text: string) => {
        await window.navigator.clipboard.writeText(text)
        notify('info', 'Copiado')
    }

    return (
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
                <div className='p-4!'>
                    <Table
                        data={movements}
                        columns={[

                            {
                                key: 'product_name',
                                label: 'Producto',
                                className: 'font-normal',
                                render: (_, row) => <span>{row.product_name}{row.sku ? <span className="ml-1 text-xs text-base-content/50">{row.sku}</span> : null}</span>,
                            },
                            {
                                key: 'sku',
                                label: 'SKU',
                                className: 'font-normal'
                            },
                            { key: 'quantity', label: 'Cantidad', className: 'font-normal tabular-nums', render: (value) => <>{parseFloat(value as string)}</> },
                            {
                                key: 'movement_type',
                                label: 'Tipo',
                                className: 'font-normal',
                                render: (_, row) => <span>{movementLabels[row.movement_type]}</span>,
                            },
                            {
                                key: 'reference_type',
                                label: 'Origen',
                                className: 'font-normal',
                                render: (_, row) => <span>{originLabel(row)}</span>,
                            },
                            {
                                key: 'reference_id',
                                className: 'font-normal',
                                label: 'Referencia',
                                render: (value) => <kbd onClick={() => copy(value as string)} className='kbd kbd-xs' >{(value as string).substring(0, 12)}</kbd>
                            },
                            { key: 'warehouse_name', label: 'Bodega', className: 'font-normal' },
                            {
                                key: 'created_at',
                                label: 'Fecha',
                                className: 'font-normal whitespace-nowrap',
                                render: (value) => <span>{new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(String(value)))}</span>,
                            },
                        ]}
                    />
                </div>
            )}
        </section>
    );
}