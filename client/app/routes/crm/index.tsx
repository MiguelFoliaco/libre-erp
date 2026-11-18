import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router';
import { apiClient } from '../../../lib/sdk';
import { CRMPage } from './../../../modules/crm/index';
import { text } from '../../../modules/language';

export default function Crm() {
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
                    : text("modules.crm.session.verificationFailed"));
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
                <span className="sr-only">{text("modules.crm.session.checking")}</span>
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
                    {text("modules.crm.common.retry")}
                </button>
            </main>
        );
    }



    return (
        <CRMPage />
    )
}
