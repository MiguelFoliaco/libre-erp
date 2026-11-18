import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router';
import { apiClient } from '@/lib/sdk';
import { InventoryPage } from '@/modules/inventory/index';

export default function Inventory() {
    const navigate = useNavigate(); // GLOBALIZA EN UNA SOLA LLAMADA
    const [status, setStatus] = useState<"checking" | "authenticated" | "error">("checking");
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;

        apiClient.restoreSession()
            .then((session) => {
                if (!active) return;
                if (session) {
                    setStatus("authenticated");
                } else {
                    navigate("/", { replace: true });
                }
            })
            .catch((cause: unknown) => {
                if (!active) return;
                setError(cause instanceof Error
                    ? cause.message
                    : "No se pudo verificar la sesión.");
                setStatus("error");
            });

        return () => {
            active = false;
        };
    }, [attempt, navigate]);

    if (status === "checking") {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
                <span className="sr-only">Verificando tu sesión...</span>
            </main>
        );
    }

    if (status === "error") {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
                <p role="alert">{error}</p>
                <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => {
                        setError("");
                        setStatus("checking");
                        setAttempt((current) => current + 1);
                    }}
                >
                    Reintentar
                </button>
            </main>
        );
    }

    return <InventoryPage />
}
