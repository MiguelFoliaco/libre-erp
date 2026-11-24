import { text } from '@/modules/language';
import { type LeftNavigation, LeftPanel } from '../common/left-panel';
import { FileText, FileTypeCorner, Hand, Route } from 'lucide-react';
import { Outlet } from 'react-router';


const primaryColor = 'bg-linear-to-tr to-gray-500 to-120% from-black'
const primaryColor10 = 'bg-linear-to-tr  to-gray-500/10 to-120% from-black/10';
const textPrimary = "text-black0"

const navigation: LeftNavigation[] = [
    { label: text('modules.userAndRoles.navigation.home'), key: '', path: '/start/documents', icon: FileText },
    { label: "Tipos de documentos", key: 'types', path: '/start/documents/types', icon: FileTypeCorner },
    { label: "Manual", key: 'entry', path: '/start/documents/entry', icon: Hand },
    { label: "Flujos", key: 'flow', path: '/start/documents/flow', icon: Route },
];


export const DocumentPage = () => {

    return (
        <div className="h-screen overflow-y-auto bg-base-200 text-base-content p-0 lg:flex">

            {/* Sidebar */}
            <LeftPanel
                primaryColor10={primaryColor10}
                textPrimary={textPrimary}
                navigation={navigation}
                primaryColor={primaryColor}
                nameModule={text('modules.listAppliaction.documents')}
                IconModule={FileText}
            />

            {/* Main */}
            <main className="min-w-0 w-full h-full " >
                <Outlet />
            </main >
        </div >
    )
}
