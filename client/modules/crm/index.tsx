import { Outlet } from 'react-router';
import { LeftPanel, type LeftNavigation } from '../common/left-panel'
import { text } from './../language/index';
import { Coins, FileText, Home, UserGroup, Users } from 'lucide-react';



const primaryColor = 'bg-linear-to-tr from-emerald-500 via-green-500 to-120% to-yellow-400'

const navigation: LeftNavigation[] = [
    { label: text('modules.crm.navigation.home'), key: '', path: '/start/crm', icon: Home },
    { label: text('modules.crm.navigation.people'), key: 'peoples', path: '/start/crm/peoples', icon: Users },
    { label: text('modules.crm.navigation.clients'), key: 'clients', path: '/start/crm/clients', icon: Coins },
    { label: text('modules.crm.navigation.documentTypes'), key: 'document-types', path: '/start/crm/document-types', icon: FileText },
    // { label: text('modules.crm.navigation.processes'), key: 'processes', path: '/start/crm/processes', icon: Workflow },
];


export const CRMPage = () => {
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
