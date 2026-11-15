import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/start", "routes/start.tsx"),
    route("/start/users-and-roles", "routes/user-and-roles.tsx", [
        index("routes/user-and-roles-home.tsx"),
        route(":section", "routes/user-and-roles-section.tsx"),
    ]),
    route("/start/settings", "routes/settings.tsx", [
        index("routes/settings-home.tsx"),
        route("company", "routes/settings-company.tsx"),
        route("branches", "routes/settings-branches.tsx"),
    ])
] satisfies RouteConfig;
