import { WelcomeBase } from '../common/welcome';
import { text } from '../language';

export const MainContentWelcome = () => (
    <div className='w-full bg-base-100 h-screen overflow-y-auto'>
        <WelcomeBase
            name={text('startModule.listAppliaction.userAndRoles')}
            description="Administra las cuentas de tu equipo, define los permisos por rol y revisa las opciones de acceso disponibles para el entorno actual."
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
                    flowName: 'Administrar usuarios',
                    description: 'Crea cuentas vinculándolas a personas existentes y administra su acceso.',
                    steps: [
                        {
                            title: 'Crear una cuenta',
                            description: 'Busca una persona por nombre o documento e ingresa su usuario y correo. La contraseña se genera automáticamente.',
                            path: '/start/users-and-roles/manager',
                            buttonTitle: 'Ir a usuarios',
                        },
                        {
                            title: 'Editar o desactivar usuarios',
                            description: 'Actualiza el usuario, el correo o el estado de una cuenta existente.',
                            path: '/start/users-and-roles/manager',
                            buttonTitle: 'Administrar usuarios',
                        },
                        {
                            title: 'Asignar roles',
                            description: 'Asigna o retira roles para controlar los permisos heredados de cada usuario.',
                            path: '/start/users-and-roles/manager',
                            buttonTitle: 'Asignar roles',
                        },
                    ],
                },
                {
                    flowName: 'Definir roles y equipos',
                    description: 'Organiza a los usuarios según los roles que comparten y limita sus acciones permitidas.',
                    steps: [
                        {
                            title: 'Crear un rol',
                            description: 'Define un nombre y selecciona las acciones permitidas por módulo. Solo puedes conceder permisos que ya tienes.',
                            path: '/start/users-and-roles/manager',
                            buttonTitle: 'Crear roles',
                        },
                        {
                            title: 'Revisar equipos por rol',
                            description: 'Consulta los grupos derivados de los usuarios que comparten cada rol.',
                            path: '/start/users-and-roles/manager',
                            buttonTitle: 'Ver equipos',
                        },
                    ],
                },
                {
                    flowName: 'Configurar opciones de acceso',
                    description: 'Explora las opciones visuales de autenticación, correo SMTP y passkeys.',
                    steps: [
                        {
                            title: 'Proveedor de autenticación',
                            description: 'Selecciona local, Google, GitHub, GitLab o Microsoft como vista previa.',
                            path: '/start/users-and-roles/settings',
                            buttonTitle: 'Abrir configuración',
                        },
                        {
                            title: 'Correo y passkeys',
                            description: 'Completa los campos SMTP y revisa la opción de Windows Hello. Estos ajustes aún no se guardan ni activan servicios.',
                            path: '/start/users-and-roles/settings',
                            buttonTitle: 'Configurar acceso',
                        },
                    ],
                },
            ]}
        />
    </div>
);

export default MainContentWelcome;
