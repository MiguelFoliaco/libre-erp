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
        <main className="pt-4">
            <HeaderStart />
            <div className='ml-20 mt-10 flex gap-2 items-center' >
                <p className=' font-semibold' >Suite operativa</p>
                <LayoutGrid className='animate-pulse hover:animate-none' size={20} />
            </div>


            <div className="px-20 grid grid-cols-7 gap-10 mt-10">
                {
                    MODULES.map(e => (
                        <Link
                            to={'/start/' + e.path}
                            viewTransition
                            onClick={(event) => {
                                if (!ihaveAccess(e.request)) {
                                    alert('No tienes permiso para acceder a este modulo')
                                    event.preventDefault()
                                    return
                                };
                            }} role="button" key={e.titleKeyPath} className={
                                clsx(

                                    " hover:scale-95 transition-all cursor-pointer active:scale-98 select-none w-40 bg-base-100 flex flex-col items-center py-5 justify-between h-45 shadow-md rounded-sm",
                                    ihaveAccess(e.request) ? '' : 'opacity-40 pointer-events-none'
                                )
                            }>
                            <div className={
                                clsx(
                                    "w-20 h-20 bg-linear-to-br flex items-center justify-center rounded-lg",
                                    e.className
                                )
                            }>
                                <e.icon className='text-white' size={50} />
                            </div>
                            <p className="font-semibold mt-4">{text(e.titleKeyPath)}</p>

                            <p className="text-xs opacity-70 w-full flex items-center justify-center">Go to <ArrowRight size={15} /></p>
                        </Link>
                    ))
                }

                <div role="button" className={
                    clsx(
                        " hover:scale-95 transition-all cursor-pointer active:scale-98 select-none w-40 bg-base-100 flex flex-col items-center py-5 justify-between h-45 shadow-md rounded-sm",
                        MODULES.length / 7 == 0 ? '' : 'col-start-7 col-end-8'
                    )
                }>
                    <div className={
                        clsx(
                            "w-20 h-20 bg-linear-to-br flex items-center justify-center rounded-lg from-blue-600 to-purple-500",
                        )
                    }>
                        <User2 className='text-white' size={50} />
                    </div>
                    <p className="font-semibold mt-4">{text('modules.listAppliaction.i')}</p>

                    <p className="text-xs opacity-70 w-full flex items-center justify-center">Go to <ArrowRight size={15} /></p>
                </div>

            </div>
        </main>
    )
}
