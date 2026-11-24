import { lazy, Suspense, type ComponentType } from "react";
import { useMatches } from "react-router";
import { routes, type RoutePageDefinition } from "../routes-registry";

type ModuleExports = Record<string, ComponentType | undefined>;

const moduleLoaders = import.meta.glob("../../modules/**/*.{ts,tsx}");

function flatten(definitions: RoutePageDefinition[]): Map<string, RoutePageDefinition> {
    const result = new Map<string, RoutePageDefinition>();
    for (const definition of definitions) {
        result.set(definition.id, definition);
        if (definition.children) {
            for (const [id, child] of flatten(definition.children)) result.set(id, child);
        }
    }
    return result;
}

export const routeDefinitions = flatten(routes);
const resolvedModules = new Map<string, ComponentType>();

export function resolvePage(definition: RoutePageDefinition): ComponentType {
    if (!definition.page) {
        return function MissingPage() {
            return <p className="p-6 text-error" role="alert">La ruta no tiene una página configurada: {definition.id}</p>;
        };
    }

    const cacheKey = `${definition.page}:${definition.exportName ?? "default"}`;
    const cached = resolvedModules.get(cacheKey);
    if (cached) return cached;

    const cleanPage = definition.page.replace(/\.tsx$/, "").replace(/\.ts$/, "");
    const modulePath = `../../${cleanPage}`;
    let selectedLoader: (() => Promise<unknown>) | null = moduleLoaders[`${modulePath}.tsx`]
        ?? moduleLoaders[`${modulePath}.ts`]
        ?? moduleLoaders[`${modulePath}/index.tsx`]
        ?? null;

    if (!selectedLoader) {
        const suffix = definition.page.replace(/^modules\//, "");
        const match = Object.entries(moduleLoaders).find(([path]) =>
            path.endsWith(`/modules/${suffix}.tsx`)
            || path.endsWith(`/modules/${suffix}/index.tsx`)
        );
        selectedLoader = match?.[1] ?? null;
    }

    if (!selectedLoader) {
        return function MissingPage() {
            return <p className="p-6 text-error" role="alert">No se encontró la página configurada: {definition.page}</p>;
        };
    }

    const resolvedLoader = selectedLoader;
    const LazyPage = lazy(async () => {
        const loaded = await resolvedLoader() as ModuleExports;
        const Page = definition.exportName
            ? loaded[definition.exportName]
            : loaded.default;

        if (!Page) {
            throw new Error(`La exportación "${definition.exportName ?? "default"}" no existe en ${definition.page}`);
        }
        return { default: Page };
    });

    resolvedModules.set(cacheKey, LazyPage);
    return LazyPage;
}

export default function DynamicModule() {
    const matches = useMatches();
    const match = matches[matches.length - 1];
    const definition = routeDefinitions.get(match?.id ?? "");

    if (!definition) {
        return <p className="p-6 text-error" role="alert">La ruta no tiene una definición asociada.</p>;
    }

    const Page = resolvePage(definition);
    return (
        <Suspense fallback={<div className="flex min-h-40 items-center justify-center"><span className="loading loading-spinner text-primary" /></div>}>
            <Page />
        </Suspense>
    );
}
