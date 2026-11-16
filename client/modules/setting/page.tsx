import React from 'react'
import { LeftPanel, type LeftNavigation } from '../common/left-panel';
import { text } from '../language';
import { Building, Settings, Store } from 'lucide-react';
import { Outlet } from 'react-router';

const primaryColor = 'bg-linear-to-tr to-gray-500 to-120% from-black'

const navigation: LeftNavigation[] = [
    { label: text('modules.userAndRoles.navigation.home'), key: '', path: '/start/settings', icon: Settings },
    { label: text('modules.settings.navigation.company'), key: 'company', path: '/start/settings/company', icon: Building },
    { label: text('modules.settings.navigation.branches'), key: 'branches', path: '/start/settings/branches', icon: Store },
];


export const SettingPage = () => {
    return (
        <div className="h-screen overflow-y-auto bg-base-200 text-base-content p-0 lg:flex">

            {/* Sidebar */}
            <LeftPanel
                navigation={navigation}
                primaryColor={primaryColor}
                nameModule={text('modules.listAppliaction.settings')}
                IconModule={Settings}
            />

            {/* Main */}
            <main className="min-w-0 w-full h-full " >
                <Outlet />
            </main >
        </div >
    )
}
