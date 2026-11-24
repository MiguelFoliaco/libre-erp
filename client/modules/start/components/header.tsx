import { Grid3X3, Languages, LogOutIcon } from 'lucide-react';
import { text } from '@/modules/language';
import { useSession } from '@/modules/auth/hook/store';
import { useTheme } from '@/modules/theme';
// import { useLanguage } from '@/modules/language/hook'; // HASTA TERMINAR LA TRADUCCION TOTAL

export const HeaderStart = () => {

    // const { toggleLanguage } = useLanguage()
    const { logout, isLoading } = useSession()
    const { theme } = useTheme()

    return (
        <header className="border-b border-base-300/70 bg-base-100/90 px-5 backdrop-blur sm:px-8">
            <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary text-white shadow-sm shadow-primary/20">
                    <Grid3X3 className="size-5" aria-hidden="true" />
                </div>
                <img src={theme === 'lofi-2' ? '/dark.png' : '/light.png'} className="h-6" alt="LibreERP" />
                <span className="ml-1 hidden rounded-md bg-base-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-base-content/50 sm:inline-flex">
                    Workspace
                </span>
                <button
                    type="button"
                    onClick={() => logout().then(() => window.location.reload())}
                    disabled={isLoading}
                    className="btn btn-ghost btn-sm ml-auto gap-2 rounded-lg text-base-content/60 hover:text-error"
                >
                    {text('login.logout')}
                    <LogOutIcon className="size-4" aria-hidden="true" />
                </button>
            </div>
        </header>
    )
}
