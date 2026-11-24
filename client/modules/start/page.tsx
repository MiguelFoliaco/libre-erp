import { useCallback } from 'react';
import { useSession } from '../auth/hook/store';
import { text, type PathText } from '../language';
import { HeaderStart } from './components/header';
import { ArrowRight, ChartColumn, FileText, Groceries, LayoutGrid, PackageSearch, Settings, ShoppingCartPlus, StoreIcon, Summary, User2, UserGroup, UserRoundShield } from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '../language/hook';
import { Link } from 'react-router';



const MODULES: {
    icon: typeof UserRoundShield,
    titleKeyPath: PathText,
    request: string[];
    className: string
    path: string
}[] = [
        {
            icon: ChartColumn,
            titleKeyPath: 'modules.listAppliaction.selling',
            request: ['*', 'sale-*'],
            className: 'from-emerald-500 to-120% to-cyan-400',
            path: '/selling'
        },
        {
            icon: UserGroup,
            titleKeyPath: 'modules.listAppliaction.crm',
            request: ['*', 'Client[READ|INSERT|UPDATE]'],
            className: 'from-emerald-500 via-green-500 to-120% to-yellow-400',
            path: '/crm'
        },
        {
            icon: ShoppingCartPlus,
            titleKeyPath: 'modules.listAppliaction.pos',
            request: ['*', 'sale-*'],
            className: 'from-purple-500 to-120% to-pink-400',
            path: 'pos'
        },
        {
            icon: PackageSearch,
            titleKeyPath: 'modules.listAppliaction.inventory',
            request: ['*', 'Inventory'],
            className: 'from-yellow-500 to-120% to-orange-400',
            path: 'inventory'
        },
        {
            icon: Summary,
            titleKeyPath: 'modules.listAppliaction.reports',
            request: ['*', 'Reports'],
            className: 'from-red-500 to-120% to-red-400',
            path: '/reports'
        },
        {
            icon: Groceries,
            titleKeyPath: 'modules.listAppliaction.product',
            request: ['*', 'Product[READ', 'Product[INSERT'],
            className: 'from-blue-500 to-120% to-cyan-400',
            path: '/products'
        },
        {
            icon: FileText,
            titleKeyPath: 'modules.listAppliaction.documents',
            request: ['*', 'Reports'],
            className: 'from-gray-500 to-120% to-black',
            path: '/documents'
        },
        {
            icon: StoreIcon,
            titleKeyPath: 'modules.listAppliaction.marketplace',
            request: ['*', 'Marketplace'],
            className: 'to-blue-500 via-pink-500 to-120% from-red-500',
            path: '/marketplace'
        },
        {
            icon: Settings,
            titleKeyPath: 'modules.listAppliaction.settings',
            request: ['*', 'Reports'],
            className: 'to-gray-500 to-120% from-black',
            path: '/settings'
        },
        {
            icon: UserRoundShield,
            titleKeyPath: 'modules.listAppliaction.userAndRoles',
            request: ['*', 'users', 'roles', 'user-roles'],
            className: 'from-red-500 to-120% to-orange-600',
            path: '/users-and-roles'
        }
    ]

export const StartPage = () => {
    const _ = useLanguage(state => state.language)
    const { user } = useSession()

    const ihaveAccess = useCallback((request: string[]) => {
        if (!user) return false
        return request.some(e => user?.rol_actions?.includes(e))
    }, [user])



    return (
        <main className="min-h-screen bg-base-200">
            <HeaderStart />
            <section className="mx-auto max-w-360 px-5 pb-12 pt-10 sm:px-8 lg:px-12 lg:pt-14">
                <div className="mb-8 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                            <span className="size-1.5 rounded-full bg-primary" /> LibreERP · Workspace
                        </p>
                        <h1 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">Suite operativa</h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-base-content/60">
                            Accede a tus herramientas de gestión y mantén cada área de tu negocio conectada.
                        </p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-base-300/80 bg-base-100 px-3 py-2 text-xs font-medium text-base-content/60 shadow-sm">
                        <LayoutGrid size={15} className="text-primary" aria-hidden="true" />
                        {MODULES.filter((module) => ihaveAccess(module.request)).length} módulos disponibles
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {MODULES.map((module) => {
                        const hasAccess = ihaveAccess(module.request);
                        const Icon = module.icon;
                        return (
                            <Link
                                to={'/start/' + module.path}
                                viewTransition
                                key={module.titleKeyPath}
                                aria-disabled={!hasAccess}
                                onClick={(event) => {
                                    if (!hasAccess) event.preventDefault();
                                }}
                                className={clsx(
                                    "group flex min-h-32 items-center gap-4 rounded-sm border border-base-300/70 bg-base-100 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg hover:shadow-base-content/5 focus-visible:outline-primary",
                                    !hasAccess && "cursor-not-allowed opacity-45"
                                )}
                            >
                                <div className={clsx("grid size-14 shrink-0 place-items-center rounded-xl bg-linear-to-br shadow-sm transition-transform group-hover:scale-105", module.className)}>
                                    <Icon className="text-white" size={25} aria-hidden="true" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold tracking-tight text-base-content">{text(module.titleKeyPath)}</p>
                                    <p className="mt-1 text-xs text-base-content/50">{hasAccess ? "Abrir módulo" : "Acceso restringido"}</p>
                                </div>
                                <ArrowRight size={17} className="shrink-0 text-base-content/30 transition-all group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                            </Link>
                        );
                    })}
                    <div className="flex min-h-32 items-center gap-4 rounded-2xl border border-dashed border-base-300 bg-base-100/60 p-5">
                        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-base-200 text-base-content/50">
                            <User2 size={24} aria-hidden="true" />
                        </div>
                        <div>
                            <p className="font-semibold text-base-content/70">{text('modules.listAppliaction.i')}</p>
                            <p className="mt-1 text-xs text-base-content/50">Próximamente</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
