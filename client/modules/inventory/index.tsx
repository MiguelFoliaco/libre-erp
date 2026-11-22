import { ArrowLeftRight, Boxes, Home, Warehouse } from 'lucide-react';
import { Outlet } from 'react-router';
import { LeftPanel, type LeftNavigation } from '../common/left-panel';
import { text } from '../language';

const primaryColor = 'bg-linear-to-tr from-yellow-500 to-120% to-orange-400';
const primaryColor10 = 'bg-linear-to-tr from-yellow-500/10 to-120% to-orange-400/10';
const textPrimary = "text-orange-500"

const navigation: LeftNavigation[] = [
    { label: 'Inicio', key: '', path: '/start/inventory', icon: Home },
    { label: 'Bodegas', key: 'warehouses', path: '/start/inventory/warehouses', icon: Warehouse },
    { label: 'Inventario', key: 'stock', path: '/start/inventory/stock', icon: Boxes },
    { label: 'Movimientos', key: 'movements', path: '/start/inventory/movements', icon: ArrowLeftRight },
];

export const InventoryPage = () => {
    return (
        <div className="h-screen overflow-y-auto bg-base-100 p-0 text-base-content lg:flex">
            <LeftPanel
                navigation={navigation}
                primaryColor10={primaryColor10}
                textPrimary={textPrimary}
                primaryColor={primaryColor}
                nameModule={text('modules.listAppliaction.inventory')}
                IconModule={Boxes}
            />
            <main className="h-full min-w-0 w-full">
                <Outlet />
            </main>
        </div>
    );
};
