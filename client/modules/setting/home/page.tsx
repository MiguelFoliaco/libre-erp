import { WelcomeBase } from './../../common/welcome';
import { text } from './../../language';


const primaryColor = 'bg-linear-to-tr to-gray-500 to-120% from-black'
const textPrimaryColorGradient = 'bg-linear-to-r from-black to-50% to-gray-500 bg-clip-text text-transparent'

export default function SettingsHome() {
    return (
        <div className='w-full bg-base-100 h-screen overflow-y-auto'>
            <WelcomeBase
                urlExternalDocumentation='https://libreerp.foliacos.com'
                theme={{
                    bgColorBase: 'bg-black',
                    colorPrimary: primaryColor,
                    textColor: textPrimaryColorGradient,
                    colorIcon: 'text-black',
                    primaryColor20: 'bg-linear-to-tr from-black/10 to-120% to-gray-500/10',
                    textColorBase: 'text-white'
                }}
                name={text('modules.listAppliaction.settings')}
                description={text('modules.settings.welcome.description')}
            />
        </div>
    );
}
