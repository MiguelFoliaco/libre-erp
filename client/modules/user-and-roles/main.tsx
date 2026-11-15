import { WelcomeBase } from '../common/welcome';
import { text } from '../language';

export const MainContentWelcome = () => (
    <div className='w-full bg-base-100 h-screen overflow-y-auto'>
        <WelcomeBase
            name={text('startModule.listAppliaction.userAndRoles')}
            description={text('startModule.userAndRoles.welcome.description')}
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
                    flowName: text('startModule.userAndRoles.welcome.usersFlow'),
                    description: text('startModule.userAndRoles.welcome.usersFlowDescription'),
                    steps: [
                        {
                            title: text('startModule.userAndRoles.welcome.createAccount'),
                            description: text('startModule.userAndRoles.welcome.createAccountDescription'),
                            path: '/start/users-and-roles/manager',
                            buttonTitle: text('startModule.userAndRoles.welcome.goToUsers'),
                        },
                        {
                            title: text('startModule.userAndRoles.welcome.editUsers'),
                            description: text('startModule.userAndRoles.welcome.editUsersDescription'),
                            path: '/start/users-and-roles/manager',
                            buttonTitle: text('startModule.userAndRoles.welcome.manageUsers'),
                        },
                        {
                            title: text('startModule.userAndRoles.welcome.assignRoles'),
                            description: text('startModule.userAndRoles.welcome.assignRolesDescription'),
                            path: '/start/users-and-roles/manager',
                            buttonTitle: text('startModule.userAndRoles.welcome.assignRolesButton'),
                        },
                    ],
                },
                {
                    flowName: text('startModule.userAndRoles.welcome.rolesFlow'),
                    description: text('startModule.userAndRoles.welcome.rolesFlowDescription'),
                    steps: [
                        {
                            title: text('startModule.userAndRoles.welcome.createRole'),
                            description: text('startModule.userAndRoles.welcome.createRoleDescription'),
                            path: '/start/users-and-roles/manager',
                            buttonTitle: text('startModule.userAndRoles.welcome.createRolesButton'),
                        },
                        {
                            title: text('startModule.userAndRoles.welcome.teamsByRole'),
                            description: text('startModule.userAndRoles.welcome.teamsByRoleDescription'),
                            path: '/start/users-and-roles/manager',
                            buttonTitle: text('startModule.userAndRoles.welcome.viewTeams'),
                        },
                    ],
                },
                {
                    flowName: text('startModule.userAndRoles.welcome.accessFlow'),
                    description: text('startModule.userAndRoles.welcome.accessFlowDescription'),
                    steps: [
                        {
                            title: text('startModule.userAndRoles.welcome.authProvider'),
                            description: text('startModule.userAndRoles.welcome.authProviderDescription'),
                            path: '/start/users-and-roles/settings',
                            buttonTitle: text('startModule.userAndRoles.welcome.openSettings'),
                        },
                        {
                            title: text('startModule.userAndRoles.welcome.emailAndPasskeys'),
                            description: text('startModule.userAndRoles.welcome.emailAndPasskeysDescription'),
                            path: '/start/users-and-roles/settings',
                            buttonTitle: text('startModule.userAndRoles.welcome.configureAccess'),
                        },
                    ],
                },
            ]}
        />
    </div>
);

export default MainContentWelcome;
