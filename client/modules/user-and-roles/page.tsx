import { Outlet } from "react-router";
import { LeftPanel, type LeftNavigation } from "../common/left-panel";
import { LayoutDashboard, Settings, UserRoundShield, UsersRound } from "lucide-react";
import { text } from "../language";

const primaryColor = 'bg-linear-to-tr from-red-500 to-120% to-orange-600'


export function UserAndRolesPage() {
  const navigation: LeftNavigation[] = [
    { label: text('startModule.userAndRoles.navigation.home'), key: '', path: '/start/users-and-roles', icon: LayoutDashboard },
    { label: text('startModule.userAndRoles.navigation.manager'), key: 'manager', path: '/start/users-and-roles/manager', icon: UsersRound },
    { label: text('startModule.userAndRoles.navigation.settings'), key: 'settings', path: '/start/users-and-roles/settings', icon: Settings },
  ];

  return (
    <div className="h-screen overflow-y-auto bg-base-200 text-base-content p-0 lg:flex">

      {/* Sidebar */}
      <LeftPanel
        navigation={navigation}
        primaryColor={primaryColor}
        nameModule={text('startModule.listAppliaction.userAndRoles')}
        IconModule={UserRoundShield}
      />

      {/* Main */}
      <main className="min-w-0 w-full h-full " >
        <Outlet />
      </main >
    </div >
  );
}
