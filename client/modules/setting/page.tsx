import React from 'react'
import { LeftPanel, type LeftNavigation } from '../common/left-panel';
import { text } from '../language';
import { Building, Settings, Store } from 'lucide-react';
import { Outlet } from 'react-router';

const primaryColor = 'bg-linear-to-tr to-gray-500 to-120% from-black'

const navigation: LeftNavigation[] = [
    { label: text('startModule.userAndRoles.navigation.settings'), key: '', path: '/start/settings', icon: Settings },
    { label: 'Compañia', key: 'company', path: '/start/settings/company', icon: Building },
    { label: 'Ambiente', key: 'enviroments', path: '/start/settings/enviroments', icon: Store },
];


export const SettingPage = () => {
    return (
        <div className="h-screen overflow-y-auto bg-base-200 text-base-content p-0 lg:flex">

            {/* Sidebar */}
            <LeftPanel
                navigation={navigation}
                primaryColor={primaryColor}
                nameModule={text('startModule.listAppliaction.settings')}
                IconModule={Settings}
            />

            {/* Main */}
            <main className="min-w-0 w-full h-full " >
                <Outlet />
            </main >
        </div >
    )
}
