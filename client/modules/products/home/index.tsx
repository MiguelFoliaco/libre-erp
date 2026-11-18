import React from 'react'
import { text } from './../../language/index';
import { WelcomeBase } from './../../common/welcome';


const primaryColor = 'bg-linear-to-tr from-blue-500 to-120% to-cyan-400'
const textPrimaryColorGradient = 'bg-linear-to-r from-blue-500 to-120% to-cyan-400 bg-clip-text text-transparent'


export const ProductsHome = () => {
    return (
        <div className='w-full bg-base-100 h-screen overflow-y-auto'>
            <WelcomeBase
                urlExternalDocumentation='https://libreerp.foliacos.com'
                theme={{
                    bgColorBase: 'bg-success',
                    colorPrimary: primaryColor,
                    textColor: textPrimaryColorGradient,
                    colorIcon: 'text-blue-700',
                    primaryColor20: 'bg-linear-to-tr from-blue-500/20 to-120%/20 to-cyan-400/20',
                    textColorBase: 'text-white'
                }}
                name={text('modules.listAppliaction.crm')}
                description={text('modules.crm.welcome.description')}
                flow={[
                    {
                        flowName: text('modules.crm.welcome.peopleFlowName'),
                        description: text('modules.crm.welcome.peopleFlowDescription'),
                        steps: [
                            {
                                title: text('modules.crm.welcome.createPersonTitle'),
                                description: text('modules.crm.welcome.createPersonDescription'),
                                path: '/start/crm/peoples',
                                buttonTitle: text('modules.crm.welcome.openPeople'),
                            },
                            {
                                title: text('modules.crm.welcome.findPersonTitle'),
                                description: text('modules.crm.welcome.findPersonDescription'),
                                path: '/start/crm/peoples',
                                buttonTitle: text('modules.crm.welcome.managePeople'),
                            },
                        ],
                    },
                    {
                        flowName: text('modules.crm.welcome.clientsFlowName'),
                        description: text('modules.crm.welcome.clientsFlowDescription'),
                        steps: [
                            {
                                title: text('modules.crm.welcome.linkPersonTitle'),
                                description: text('modules.crm.welcome.linkPersonDescription'),
                                path: '/start/crm/clients',
                                buttonTitle: text('modules.crm.welcome.openClients'),
                            },
                            {
                                title: text('modules.crm.welcome.setTermsTitle'),
                                description: text('modules.crm.welcome.setTermsDescription'),
                                path: '/start/crm/clients',
                                buttonTitle: text('modules.crm.welcome.manageClients'),
                            },
                        ],
                    },
                    {
                        flowName: text('modules.crm.welcome.documentTypesFlowName'),
                        description: text('modules.crm.welcome.documentTypesFlowDescription'),
                        steps: [
                            {
                                title: text('modules.crm.welcome.createDocumentTypeTitle'),
                                description: text('modules.crm.welcome.createDocumentTypeDescription'),
                                path: '/start/crm/document-types',
                                buttonTitle: text('modules.crm.welcome.openDocumentTypes'),
                            },
                        ],
                    },
                ]}
            />
        </div>
    )
}

export default ProductsHome