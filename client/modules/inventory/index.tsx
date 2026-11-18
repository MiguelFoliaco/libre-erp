import { Outlet } from 'react-router';
import { LeftPanel, type LeftNavigation } from '../common/left-panel'
import { text } from './../language/index';
import { CarFront, Coins, Home, Package, Store, UserGroup, Users, FileBadge } from 'lucide-react';



const primaryColor = 'bg-linear-to-tr from-yellow-500 to-120% to-orange-400'

const navigation: LeftNavigation[] = [
    { label: 'Bodegas', key: '', path: '/start/crm', icon: Store },
    { label: 'Traslados', key: 'peoples', path: '/start/crm/peoples', icon: CarFront },
    { label: 'Movimientos', key: 'clients', path: '/start/crm/clients', icon: Package },
    { label: 'Reportes', key: 'clients', path: '/start/crm/clients', icon: FileBadge },
    // { label: text('modules.crm.navigation.processes'), key: 'processes', path: '/start/crm/processes', icon: Workflow },
];


export const InventoryPage = () => {
    return (
        <div className="h-screen overflow-y-auto bg-base-200 text-base-content p-0 lg:flex">

            {/* Sidebar */}
            <LeftPanel
                navigation={navigation}
                primaryColor={primaryColor}
                nameModule={text('modules.listAppliaction.crm')}
                IconModule={UserGroup}
            />

            {/* Main */}
            <main className="min-w-0 w-full h-full " >
                <Outlet />
            </main >
        </div >
    )
}
