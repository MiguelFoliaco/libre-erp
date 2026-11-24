import { type RouteConfig, type RouteConfigEntry, index, route } from "@react-router/dev/routes";
import { routes, type RoutePageDefinition } from "./routes-registry";

function buildRoute(definition: RoutePageDefinition): RouteConfigEntry {
    const options = { id: definition.id };

    if (definition.index) return index("routes/dynamic-module.tsx", options);
    if (!definition.path) throw new Error(`La ruta "${definition.id}" no tiene path ni es index`);

    const children = definition.children?.map(buildRoute);
    const file = children?.length
        ? "routes/dynamic-layout.tsx"
        : "routes/dynamic-module.tsx";
    return route(definition.path, file, options, children);
}

export default [
    index("routes/home.tsx"),
    route("/start", "routes/auth-layout.tsx", { id: "start-layout" }, [
        ...routes.flatMap((definition) => definition.children ?? []).map(buildRoute),
    ]),
] satisfies RouteConfig;
