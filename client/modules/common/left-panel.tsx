import { LayoutDashboard, LogOut, SkipBack, UsersRound } from 'lucide-react';
// import React from 'react'
import { text } from '../language';
import { clsx } from 'clsx';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useSession } from '../auth/hook/store';


// const primaryColor20 = 'bg-linear-to-tr from-red-500/10 to-120% to-orange-600/10'
// const textColor =
//     "bg-linear-to-r from-red-500 to-orange-600 bg-clip-text text-transparent";

export type LeftNavigation = {
    label: string
    key: string
    path: string
    icon: typeof UsersRound
}



type LeftPanelProps = {
    navigation: LeftNavigation[]
    primaryColor: string
    nameModule: string;
    IconModule: typeof LayoutDashboard
}

export const LeftPanel = (
    {
        navigation,
        primaryColor,
        nameModule,
        IconModule
    }: LeftPanelProps
) => {

    const { logout, user } = useSession()
    const { section } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <aside className="h-screen sticky top-0 w-60 shrink-0 border-r border-base-300 bg-base-100 flex flex-col">
            <div className="flex h-16 items-center gap-3 border-b border-base-300 px-5">
                <div className={"grid size-9 place-items-center text-white rounded-md " + primaryColor}>
                    <IconModule size={19} />
                </div>
                <div className="min-w-0">
                    <p className="font-bold tracking-tight">LibreERP</p>
                    <p className="text-xs text-base-content/50">
                        {nameModule}
                    </p>
                </div>
            </div>

            <div className="px-3 py-6 bfg">
                <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-base-content/40">
                    {text('common.leftPanel.workspace')}
                </p>

                <ul className="w-full flex flex-col gap-1 p-0">
                    {navigation.map(({ label, icon: Icon, path, key }) => (
                        <li
                            onClick={() => navigate(path)}
                            key={label}
                            className={clsx(
                                "w-full flex cursor-pointer p-1 items-center gap-2 pl-2 hover:pl-3 transition-all rounded-sm hover:bg-base-200/50",
                                (location.pathname === path ||
                                    (section !== undefined && section === key)) &&
                                    "active font-semibold text-white " + primaryColor
                            )}>
                            <Icon size={17} />
                            <a
                                aria-current={
                                    location.pathname === path ||
                                    (section !== undefined && section === key)
                                        ? "page"
                                        : undefined
                                }
                            >
                                {label}
                            </a>
                        </li>
                    ))}
                    <li
                        onClick={() => navigate('/start')}
                        className={
                            clsx(
                                "w-full mt-auto flex cursor-pointer p-1 items-center gap-2 pl-2 hover:pl-3 transition-all rounded-sm hover:bg-base-200/50",
                            )

                        }>
                        <SkipBack size={17} />
                        <a
                            aria-current={"page"}
                        >
                            {text('common.leftPanel.returnHome')}
                        </a>
                    </li>
                </ul>
            </div>

            <div className="mt-auto border-t border-base-300 p-3">
                <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-base-200">
                    <div className="avatar avatar-placeholder">
                        <div className={" text-neutral-content w-10 rounded-full " + primaryColor}>
                            <span className="text-sm">{user?.firstName?.charAt(0)}</span>
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{(user?.firstName + ' ' + user?.lastName).substring(0, 15)}</p>
                        <p className="truncate text-xs text-base-content/50">
                            {user?.rol_name}
                        </p>
                    </div>

                    <div
                        className="tooltip cursor-pointer"
                        data-tip={text('common.leftPanel.logout')}
                    >
                        <LogOut
                            onClick={logout}
                            size={18}
                            className="text-error"
                            aria-label={text('common.leftPanel.logout')}
                        />
                    </div>
                </button>
            </div>
        </aside >
    )
}
