import { lazy, Suspense } from "react";
import { useParams } from "react-router";

const LazyManager = lazy(() => import("./manager/manager"));
const LazySettings = lazy(() => import("./components/setting/form"));

export default function SectionPage() {
    const { section } = useParams();

    return (
        <Suspense fallback={<div className="skeleton m-auto mt-20 h-10/12 w-10/12" />}>
            {section === "manager" && <LazyManager />}
            {section === "settings" && <LazySettings />}
            {section !== "manager" && section !== "settings" && (
                <p className="p-6" role="alert">La sección solicitada no existe.</p>
            )}
        </Suspense>
    );
}
