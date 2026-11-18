import { create } from "zustand";
import { apiClient, type AuthenticatedUser } from "@/lib/sdk";
import { text } from "@/modules/language";


type SessionState = {
    //GETTERS
    user: AuthenticatedUser | null;
    session: {
        accessToken: string | null;
        expiresAt: number | null;
    }
    isLoading: boolean;
    error: string | null;

    // SETTERS

    setUser: (user: AuthenticatedUser | null) => void;
    setSession: (session: SessionState['session']) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    logout: () => Promise<void>
}

export const useSession = create<SessionState>(set => ({
    user: null,
    session: {
        accessToken: null,
        expiresAt: null,
    },
    isLoading: true,
    error: null,

    setUser: (user) => set(() => ({ user })),
    setSession: (session) => set(() => ({ session })),
    setIsLoading: (isLoading) => set(() => ({ isLoading })),
    setError: (error) => set(() => ({ error })),
    logout: async () => {
        set({ isLoading: true });

        try {
            await apiClient.logout();
            set({ user: null, session: { accessToken: null, expiresAt: null }, error: '' });
        } catch (cause: unknown) {
            set({
                error:
                    cause instanceof Error
                        ? cause.message
                        : text('login.errors.no-could-logout')
            });
        } finally {
            set({ isLoading: false });
        }
    }
}))