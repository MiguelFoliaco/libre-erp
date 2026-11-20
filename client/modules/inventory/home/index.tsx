import { WelcomeBase } from '@/modules/common/welcome';
import { text } from '@/modules/language';

const primaryColor = 'bg-linear-to-tr from-yellow-500 to-120% to-orange-400';
const textPrimaryColorGradient = 'bg-linear-to-r from-yellow-500 to-120% to-orange-400 bg-clip-text text-transparent';

export const InventoryHome = () => {
    return (
        <div>
            <WelcomeBase
                urlExternalDocumentation="https://libreerp.foliacos.com"
                theme={{
                    bgColorBase: 'bg-success',
                    colorPrimary: primaryColor,
                    textColor: textPrimaryColorGradient,
                    colorIcon: 'text-yellow-700',
                    primaryColor20: 'bg-linear-to-tr from-yellow-500/10 to-orange-400/10 to-120%',
                    textColorBase: 'text-white'
                }}
                name={text('modules.listAppliaction.inventory')}
                description="Administra las bodegas de tu compañía, consulta las existencias por producto y registra entradas, salidas, ajustes y traslados con trazabilidad por environment."
                flow={[
                    {
                        flowName: 'Configurar bodegas',
                        description: 'Crea bodegas y habilítalas para operar inventario.',
                        steps: [{
                            title: 'Administrar bodegas y proveedores',
                            description: 'Registra ubicaciones de almacenamiento y sus proveedores.',
                            path: '/start/inventory/warehouses',
                            buttonTitle: 'Abrir bodegas'
                        }]
                    },
                    {
                        flowName: 'Consultar existencias',
                        description: 'Revisa cantidades disponibles y reservadas en cada bodega.',
                        steps: [{
                            title: 'Ver stock por producto',
                            description: 'Filtra las existencias por bodega y producto.',
                            path: '/start/inventory/stock',
                            buttonTitle: 'Consultar inventario'
                        }]
                    },
                    {
                        flowName: 'Registrar movimientos',
                        description: 'Controla ingresos, salidas, ajustes y traslados.',
                        steps: [{
                            title: 'Crear un movimiento',
                            description: 'Los cambios de stock quedan registrados en el historial.',
                            path: '/start/inventory/movements',
                            buttonTitle: 'Ver movimientos'
                        }]
                    }
                ]}
            />
        </div>
    );
};
