import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/start", "routes/start.tsx"),
    route("/start/users-and-roles", "routes/user-and-roles.tsx", [
        index("routes/user-and-roles-home.tsx"),
        route(":section", "routes/user-and-roles-section.tsx"),
    ]),
    route("/start/settings", "routes/settings/index.tsx", [
        index("routes/settings/settings-home.tsx"),
        route("company", "routes/settings/settings-company.tsx"),
        route("branches", "routes/settings/settings-branches.tsx"),
    ]),
    route("/start/crm", "routes/crm/index.tsx", [
        route("peoples", "routes/crm/crm-peoples.tsx"),
        route("clients", "routes/crm/crm-clients.tsx"),
        route("document-types", "routes/crm/crm-document-types.tsx"),
        index("routes/crm/crm-home.tsx"),
    ]),
    route("/start/products", "routes/products/index.tsx", [
        index("routes/products/products-home.tsx"),
        route("search", "routes/products/products-search.tsx"),
        route("create", "routes/products/products-create.tsx"),
    ]),
    route("/start/inventory", "routes/inventory/index.tsx", [
        index("routes/inventory/inventory-home.tsx"),
    ])
] satisfies RouteConfig;
