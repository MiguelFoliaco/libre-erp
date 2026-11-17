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
        index("routes/crm/crm-home.tsx"),
    ])
] satisfies RouteConfig;
