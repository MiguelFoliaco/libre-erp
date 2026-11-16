import { WelcomeBase } from '../common/welcome';
import { text } from '../language';

export const MainContentWelcome = () => (
    <div className='w-full bg-base-100 h-screen overflow-y-auto'>
        <WelcomeBase
            name={text('modules.listAppliaction.userAndRoles')}
            description={text('modules.userAndRoles.welcome.description')}
            theme={{
                colorPrimary: 'bg-linear-to-tr from-red-500 to-120% to-orange-600',
                textColor: 'bg-linear-to-r from-red-500 to-orange-600 bg-clip-text text-transparent',
                colorIcon: 'text-red-500',
                primaryColor20: 'bg-linear-to-tr from-red-500/10 to-120% to-orange-600/10',
                textColorBase: 'text-red-500',
                bgColorBase: 'bg-red-500',
            }}
            urlExternalDocumentation="https://libreerp.foliacos.com/documentation"
            flow={[
                {
                    flowName: text('modules.userAndRoles.welcome.usersFlow'),
                    description: text('modules.userAndRoles.welcome.usersFlowDescription'),
                    steps: [
                        {
                            title: text('modules.userAndRoles.welcome.createAccount'),
                            description: text('modules.userAndRoles.welcome.createAccountDescription'),
                            path: '/start/users-and-roles/manager',
                            buttonTitle: text('modules.userAndRoles.welcome.goToUsers'),
                        },
                        {
                            title: text('modules.userAndRoles.welcome.editUsers'),
                            description: text('modules.userAndRoles.welcome.editUsersDescription'),
                            path: '/start/users-and-roles/manager',
                            buttonTitle: text('modules.userAndRoles.welcome.manageUsers'),
                        },
                        {
                            title: text('modules.userAndRoles.welcome.assignRoles'),
                            description: text('modules.userAndRoles.welcome.assignRolesDescription'),
                            path: '/start/users-and-roles/manager',
                            buttonTitle: text('modules.userAndRoles.welcome.assignRolesButton'),
                        },
                    ],
                },
                {
                    flowName: text('modules.userAndRoles.welcome.rolesFlow'),
                    description: text('modules.userAndRoles.welcome.rolesFlowDescription'),
                    steps: [
                        {
                            title: text('modules.userAndRoles.welcome.createRole'),
                            description: text('modules.userAndRoles.welcome.createRoleDescription'),
                            path: '/start/users-and-roles/manager',
                            buttonTitle: text('modules.userAndRoles.welcome.createRolesButton'),
                        },
                        {
                            title: text('modules.userAndRoles.welcome.teamsByRole'),
                            description: text('modules.userAndRoles.welcome.teamsByRoleDescription'),
                            path: '/start/users-and-roles/manager',
                            buttonTitle: text('modules.userAndRoles.welcome.viewTeams'),
                        },
                    ],
                },
                {
                    flowName: text('modules.userAndRoles.welcome.accessFlow'),
                    description: text('modules.userAndRoles.welcome.accessFlowDescription'),
                    steps: [
                        {
                            title: text('modules.userAndRoles.welcome.authProvider'),
                            description: text('modules.userAndRoles.welcome.authProviderDescription'),
                            path: '/start/users-and-roles/settings',
                            buttonTitle: text('modules.userAndRoles.welcome.openSettings'),
                        },
                        {
                            title: text('modules.userAndRoles.welcome.emailAndPasskeys'),
                            description: text('modules.userAndRoles.welcome.emailAndPasskeysDescription'),
                            path: '/start/users-and-roles/settings',
                            buttonTitle: text('modules.userAndRoles.welcome.configureAccess'),
                        },
                    ],
                },
            ]}
        />
    </div>
);

export default MainContentWelcome;
