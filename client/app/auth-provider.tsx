import React, { useEffect } from 'react'
import { useSession } from '../modules/auth/hook/store';
import { apiClient, type AuthSession } from '../lib/sdk';

type Props = {
    children: React.ReactNode
}

export const AuthProvider = ({ children }: Props) => {

    const { session, setSession, setUser, setError, setIsLoading } = useSession()


    function applySession(session: AuthSession) {
        setUser(session.user);
        setSession({ accessToken: session.accessToken, expiresAt: Date.now() + session.expiresIn * 1000 });
        setError("");
    }

    useEffect(() => {
        if (!session?.accessToken || session?.expiresAt === null) return;

        const delay = Math.max(1000, session.expiresAt - Date.now() - 60_000);

        const timer = window.setTimeout(() => {
            apiClient
                .refresh()
                .then((session) => {
                    if (!session) throw new Error("Refresh token inválido");
                    applySession(session);
                })
                .catch((cause: unknown) => {
                    setUser(null);
                    setSession({ accessToken: null, expiresAt: null });
                    setError(
                        cause instanceof Error
                            ? "Tu sesión venció. Vuelve a iniciar sesión."
                            : "No se pudo renovar la sesión. Vuelve a iniciar sesión."
                    );
                });
        }, delay);

        return () => window.clearTimeout(timer);
    }, [session]);


    useEffect(() => {
        let active = true;

        apiClient
            .restoreSession()
            .then((session) => {
                if (active && session) applySession(session);
            })
            .catch((cause: unknown) => {
                if (active && cause instanceof Error) {
                    setError(cause.message);
                }
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <>
            {children}
        </>
    )
}
