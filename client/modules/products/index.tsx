import { Ad, Boxes, ChartNoAxesGantt, FilePlus2, Home, Search } from "lucide-react";
import { Outlet } from "react-router";
import { LeftPanel, type LeftNavigation } from "../common/left-panel";
import { text } from "../language";

const primaryColor = "bg-linear-to-tr from-blue-500 via-sky-500 to-cyan-400";
const primaryColor10 = 'bg-linear-to-tr from-blue-500/10 via-sky-500/10 to-cyan-400/10';
const textPrimary = "text-blue-500"

const navigation: LeftNavigation[] = [
  {
    label: text("modules.userAndRoles.navigation.home"),
    key: "",
    path: "/start/products",
    icon: Home,
  },
  {
    label: text("modules.products.catalogs.categoriesDepartments"),
    key: "categories-departments",
    path: "/start/products/categories-departments",
    icon: ChartNoAxesGantt,
  },

  {
    label: text("modules.products.navigation.search"),
    key: "products",
    path: "/start/products/search",
    icon: Search,
  },
  {
    label: text("modules.products.navigation.create"),
    key: "create",
    path: "/start/products/create",
    icon: FilePlus2,
  },
];

export function ProductsPage() {
  return (
    <div className="flex h-screen overflow-y-auto bg-base-200 p-0 text-base-content lg:flex">
      <LeftPanel
        primaryColor10={primaryColor10}
        textPrimary={textPrimary}
        navigation={navigation}
        primaryColor={primaryColor}
        nameModule={text("modules.listAppliaction.product")}
        IconModule={Boxes}
      />
      <main className="h-full min-w-0 w-full">
        <Outlet />
      </main>
    </div>
  );
}
