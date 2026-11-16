import { WelcomeBase } from './../../common/welcome';
import { text } from './../../language';


const primaryColor = 'bg-linear-to-tr from-emerald-500 via-green-500 to-120% to-yellow-400'
const textPrimaryColorGradient = 'bg-linear-to-r from-emerald-500 via-green-500 to-120% to-yellow-400 bg-clip-text text-transparent'

export default function CrmHome() {
    return (
        <div className='w-full bg-base-100 h-screen overflow-y-auto'>
            <WelcomeBase
                urlExternalDocumentation='https://libreerp.foliacos.com'
                theme={{
                    bgColorBase: 'bg-success',
                    colorPrimary: primaryColor,
                    textColor: textPrimaryColorGradient,
                    colorIcon: 'text-emerald-700',
                    primaryColor20: 'bg-linear-to-tr from-emerald-500/10 via-green-500/10 to-120% to-yellow-400/10',
                    textColorBase: 'text-white'
                }}
                name={text('modules.listAppliaction.crm')}
                description={text('modules.settings.welcome.description')}
            />
        </div>
    );
}
