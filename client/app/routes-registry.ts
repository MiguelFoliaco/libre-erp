export type RoutePageDefinition = {
    id: string;
    path?: string;
    index?: boolean;
    page?: string;
    exportName?: string;
    children?: RoutePageDefinition[];
};

export const routes: RoutePageDefinition[] = [
    {
        id: "start",
        path: "/start",
        children: [
            {
                id: "start-home",
                index: true,
                page: "modules/start/page",
                exportName: "StartPage",
            },
            {
                id: "settings",
                path: "settings",
                page: "modules/setting/page",
                exportName: "SettingPage",
                children: [
                    { id: "settings-home", index: true, page: "modules/setting/home/page" },
                    { id: "settings-company", path: "company", page: "modules/setting/company/page" },
                    { id: "settings-branches", path: "branches", page: "modules/setting/branches/page" },
                    { id: "settings-pos", path: "pos", page: "modules/setting/pos" },
                ],
            },
            {
                id: "crm",
                path: "crm",
                page: "modules/crm",
                exportName: "CRMPage",
                children: [
                    { id: "crm-home", index: true, page: "modules/crm/home/page" },
                    { id: "crm-peoples", path: "peoples", page: "modules/crm/peoples", exportName: "Peoples" },
                    { id: "crm-clients", path: "clients", page: "modules/crm/client", exportName: "Clients" },
                    { id: "crm-document-types", path: "document-types", page: "modules/crm/document-types" },
                ],
            },
            {
                id: "products",
                path: "products",
                page: "modules/products",
                exportName: "ProductsPage",
                children: [
                    { id: "products-home", index: true, page: "modules/products/home", exportName: "ProductsHome" },
                    { id: "products-search", path: "search", page: "modules/products/search/page", exportName: "ProductSearchPage" },
                    { id: "products-create", path: "create", page: "modules/products/create/page", exportName: "ProductCreatePage" },
                    {
                        id: "products-categories",
                        path: "categories-departments",
                        page: "modules/products/catalogs/page",
                        exportName: "CatalogCategoriesDepartmentsPage",
                    },
                ],
            },
            {
                id: "inventory",
                path: "inventory",
                page: "modules/inventory",
                exportName: "InventoryPage",
                children: [
                    { id: "inventory-home", index: true, page: "modules/inventory/home", exportName: "InventoryHome" },
                    { id: "inventory-warehouses", path: "warehouses", page: "modules/inventory/warehouses/page", exportName: "InventoryWarehousesPage" },
                    { id: "inventory-stock", path: "stock", page: "modules/inventory/stock/page", exportName: "InventoryStockPage" },
                    { id: "inventory-movements", path: "movements", page: "modules/inventory/movements/page", exportName: "InventoryMovementsPage" },
                ],
            },
            {
                id: "pos",
                path: "pos",
                page: "modules/pos/page",
            },
            {
                id: "users-and-roles",
                path: "users-and-roles",
                page: "modules/user-and-roles/page",
                exportName: "UserAndRolesPage",
                children: [
                    { id: "users-and-roles-home", index: true, page: "modules/user-and-roles/main" },
                    { id: "users-and-roles-section", path: ":section", page: "modules/user-and-roles/section-page" },
                ],
            },
            {
                id: "documents",
                path: "documents",
                page: "modules/documents/page",
                exportName: "DocumentPage",
                children: [
                    { id: "documents-types",  page: "modules/documents/documents-types", exportName: "DocumentsTypes", path: "types" },
                    { id: "documents-flow", page: "modules/documents/flow", exportName: "FlowSystem", path: "flow" }
                ]
            }
        ],
    },
];
