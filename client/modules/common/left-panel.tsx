import { LayoutDashboard, LogOut, SkipBack, UsersRound } from 'lucide-react';
// import React from 'react'
import { text } from '../language';
import { clsx } from 'clsx';
import { useLocation, useParams } from 'react-router';
import { useSession } from '../auth/hook/store';
import { Link } from 'react-router';


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
    primaryColor10: string;
    textPrimary:string;
    nameModule: string;
    IconModule: typeof LayoutDashboard
}

export const LeftPanel = (
    {
        navigation,
        primaryColor,
        primaryColor10,
        nameModule,
        textPrimary,
        IconModule
    }: LeftPanelProps
) => {

    const { logout, user } = useSession()
    const { section } = useParams()
    const location = useLocation()

    return (
        <aside className="sticky top-0 flex h-screen w-64 shrink-0 select-none flex-col border-r border-base-300/80 bg-base-100">
            <div className="flex h-[76px] items-center gap-3 border-b border-base-300/70 px-5">
                <div className={clsx("grid size-10 place-items-center rounded-xl text-white shadow-sm", primaryColor)}>
                    <IconModule size={19} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                    <p className="font-semibold tracking-tight text-base-content">LibreERP</p>
                    <p className="truncate text-xs text-base-content/55">{nameModule}</p>
                </div>
            </div>

            <nav aria-label={text('common.leftPanel.workspace')} className="flex flex-1 flex-col px-3 py-6">
                <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">
                    {text('common.leftPanel.workspace')}
                </p>
                <div className="flex flex-col gap-1">
                    {navigation.map(({ label, icon: Icon, path, key }) => {
                        const isActive = location.pathname === path || (section !== undefined && section === key);
                        return (
                            <Link
                                to={path}
                                viewTransition
                                key={label}
                                aria-current={isActive ? "page" : undefined}
                                className={clsx(
                                    "flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors",
                                    isActive
                                        ? primaryColor10 + " font-semibold " + textPrimary
                                        : "text-base-content/65 hover:bg-base-200 hover:text-base-content"
                                )}
                            >
                                <Icon size={17} aria-hidden="true" />
                                <span>{label}</span>
                                {isActive && <span className={
                                    clsx(
                                        "ml-auto size-1.5 rounded-full",
                                        primaryColor
                                    )
                                } aria-hidden="true" />}
                            </Link>
                        );
                    })}
                </div>
                <Link
                    to="/"
                    viewTransition
                    className="mt-auto flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content"
                >
                    <SkipBack size={17} aria-hidden="true" />
                    <span>{text('common.leftPanel.returnHome')}</span>
                </Link>
            </nav>

            <div className="border-t border-base-300/70 p-3">
                <div className="flex items-center gap-3 rounded-xl p-2">
                    <div className={clsx("grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white", primaryColor)}>
                        {user?.firstName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{[user?.firstName, user?.lastName].filter(Boolean).join(' ')}</p>
                        <p className="truncate text-xs text-base-content/50">{user?.rol_name}</p>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-base-content/50 transition-colors hover:bg-error/10 hover:text-error"
                        aria-label={text('common.leftPanel.logout')}
                        title={text('common.leftPanel.logout')}
                    >
                        <LogOut size={17} aria-hidden="true" />
                    </button>
                </div>
            </div>
        </aside>
    )
}
