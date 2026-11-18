import React from 'react'
import { WelcomeBase } from '@/modules/common/welcome';
import { text } from '@/modules/language';



const primaryColor = 'bg-linear-to-tr from-yellow-500 to-120% to-orange-400'
const textPrimaryColorGradient = 'bg-linear-to-r from-yellow-500 to-120% to-orange-400 bg-clip-text text-transparent'

export const InventoryHome = () => {
    return (
        <div>
            <WelcomeBase
                urlExternalDocumentation='https://libreerp.foliacos.com'
                theme={{
                    bgColorBase: 'bg-success',
                    colorPrimary: primaryColor,
                    textColor: textPrimaryColorGradient,
                    colorIcon: 'text-yellow-700',
                    primaryColor20: 'bg-linear-to-tr from-yellow-500/10 to-orange-400/10 to-120%',
                    textColorBase: 'text-white'
                }}
                name={text('modules.listAppliaction.inventory')}
                description={'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Fugit aliquid quia ducimus consequatur harum. Eius earum saepe laborum possimus natus quam praesentium voluptate officiis, fuga tempora ab voluptates sed assumenda?'}
            />
            
        </div>
    )
}
