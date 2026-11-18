import { Ad, Boxes, ChartNoAxesGantt, FilePlus2, Home, Search } from "lucide-react";
import { Outlet } from "react-router";
import { LeftPanel, type LeftNavigation } from "../common/left-panel";
import { text } from "../language";

const primaryColor = "bg-linear-to-tr from-blue-500 via-sky-500 to-cyan-400";

const navigation: LeftNavigation[] = [
  {
    label: text("modules.userAndRoles.navigation.home"),
    key: "",
    path: "/start/products",
    icon: Home,
  },
  // {
  //   label: text("modules.products.fields.brand"),
  //   key: "brands",
  //   path: "/start/products/brands",
  //   icon: Ad,
  // },
  {
    label: text("modules.products.catalogs.categoriesDepartments"),
    key: "categories-departments",
    path: "/start/products/categories-departments",
    icon: ChartNoAxesGantt,
  },
  // {
  //   label: text("modules.products.fields.department"),
  //   key: "departments",
  //   path: "/start/departments",
  //   icon: ShelvingUnit,
  // },
  // { // Future feature combos - groups of products
  //   label: 'Combos',
  //   key: "combos",
  //   path: "/start/combos",
  //   icon: PackagePlus,
  // },
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
