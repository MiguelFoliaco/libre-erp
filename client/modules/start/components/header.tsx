import { Grid3X3, Languages, LogOutIcon } from 'lucide-react';
import { text } from '@/modules/language';
import { useSession } from '@/modules/auth/hook/store';
import { useLanguage } from '@/modules/language/hook';

export const HeaderStart = () => {

    const { toggleLanguage } = useLanguage()
    const { logout, isLoading } = useSession()

    return (
        <div className='w-10/11 mx-auto! p-2 border border-neutral-500/20 rounded-sm bg-white '>
            <div className='flex items-center gap-2 pr-5'>
                <div className='w-10 h-10 flex items-center justify-center bg-linear-to-tr from-primary to-90% rounded-sm to-primary-400'>
                    <Grid3X3 className='w-6 h-6 text-white' />
                </div>
                <img src="/light.png" className='h-7' alt="Logo" />

                <button
                    className='btn btn-sm btn-ghost ml-auto'
                    onClick={toggleLanguage}
                >
                    {text('firstScreen.text-change-language-1')}
                    <Languages className='w-4 h-4' />
                </button>
                <button
                    onClick={() => {
                        logout()
                            .then(() => window.location.reload())
                    }}
                    disabled={isLoading}
                    className='btn btn-sm btn-outline ml-2'
                >
                    {text('login.logout')}
                    <LogOutIcon className='w-4 h-4' /></button>
            </div>

        </div >
    )
}
