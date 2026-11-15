import React from 'react'
import { WelcomeBase } from '../common/welcome';
import { text } from '../language';




export const MainContentWelcome = () => {
    return (
        <div className='w-full bg-base-100 h-screen overflow-y-auto'>
            <WelcomeBase
                name={text('startModule.listAppliaction.userAndRoles')}
                description="En este modulo podras crear, modificar, bloquear y restablecer usuarios. Tambien podras crear los roles para controlar el acceso y alcance de cada usuario para el ambiente seleccionado."
                theme={{
                    colorPrimary: 'bg-linear-to-tr from-red-500 to-120% to-orange-600',
                    textColor: 'bg-linear-to-r from-red-500 to-orange-600 bg-clip-text text-transparent',
                    colorIcon: 'text-red-500',
                    primaryColor20: 'bg-linear-to-tr from-red-500/10 to-120% to-orange-600/10',
                    textColorBase: 'text-red-500',
                    bgColorBase: 'bg-red-500'
                }}
                urlExternalDocumentation="https://libreerp.foliacos.com/documentation"
                flow={[
                    {
                        flowName: 'Set up your products',
                        description: 'Start by organizing and registering the products you want to manage.',
                        steps: [
                            {
                                title: 'Create categories',
                                description: 'Organize your products into categories.',
                                path: '/inventory/categories',
                                buttonTitle: 'Manage categories'
                            },
                            {
                                title: 'Register products',
                                description: 'Add product names, references and prices.',
                                path: '/inventory/products',
                                buttonTitle: 'Create products'
                            },
                            {
                                title: 'Configure warehouses',
                                description: 'Define where your products will be stored.',
                                path: '/inventory/warehouses',
                                buttonTitle: 'Manage warehouses'
                            }
                        ]
                    },
                    {
                        flowName: 'Manage stock',
                        description: 'Learn how to control and manage your inventory movements.',
                        steps: [
                            {
                                title: 'Register incoming stock',
                                description: 'Record products received into your warehouse.',
                                path: '/inventory/movements/in',
                                buttonTitle: 'Register entry'
                            },
                            {
                                title: 'Transfer products',
                                description: 'Move products between warehouses.',
                                path: '/inventory/transfers',
                                buttonTitle: 'Create transfer'
                            }
                        ]
                    }
                ]}
            />
        </div>
    )
}


export default MainContentWelcome