import { Outlet } from "react-router";
import { LeftPanel } from "./components/left-panel";



export function UserAndRolesPage() {

  return (
    <div className="h-screen overflow-y-auto bg-base-200 text-base-content p-0 lg:flex">

      {/* Sidebar */}
      <LeftPanel />

      {/* Main */}
      <main className="min-w-0 w-full h-full " >
        <Outlet />
      </main >
    </div >
  );
}
