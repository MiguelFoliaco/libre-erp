import { Suspense, type ComponentType } from "react";
import { useMatches } from "react-router";
import { resolvePage, routeDefinitions } from "./dynamic-module";

export default function DynamicLayout() {
    const matches = useMatches();

    const match = [...matches]
        .reverse()
        .find((item) => {
            const definition = routeDefinitions.get(item.id);
            return Boolean(definition?.children?.length);
        });

    const definition = match ? routeDefinitions.get(match.id) : undefined;

    if (!definition) {
        return <p className="p-6 text-error" role="alert">El layout no tiene una definición asociada.</p>;
    }

    const Layout = resolvePage(definition) as ComponentType;
    return (
        <Suspense fallback={<div className="flex min-h-40 items-center justify-center"><span className="loading loading-spinner text-primary" /></div>}>
            <Layout />
        </Suspense>
    );
}
