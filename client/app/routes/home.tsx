import { useEffect, useState, type FormEvent } from "react";
import type { Route } from "./+types/home";
import {
  apiClient,
  type AuthenticatedUser,
  type AuthSession,
} from "../../lib/sdk";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Iniciar sesión | LibreERP" },
    { name: "description", content: "Accede a tu espacio de LibreERP." },
  ];
}

export default function Home() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function applySession(session: AuthSession) {
    setUser(session.user);
    setAccessToken(session.accessToken);
    setExpiresAt(Date.now() + session.expiresIn * 1000);
    setError("");
  }

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

  useEffect(() => {
    if (!accessToken || expiresAt === null) return;
    const delay = Math.max(1000, expiresAt - Date.now() - 60_000);
    const timer = window.setTimeout(() => {
      apiClient
        .refresh()
        .then((session) => {
          if (!session) {
            throw new Error("Refresh token inválido");
          }
          applySession(session);
        })
        .catch((cause: unknown) => {
          setUser(null);
          setAccessToken(null);
          setExpiresAt(null);
          setError(
            cause instanceof Error
              ? "Tu sesión venció. Vuelve a iniciar sesión."
              : "No se pudo renovar la sesión. Vuelve a iniciar sesión.",
          );
        });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [accessToken, expiresAt]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const companyId = String(formData.get("companyId") ?? "").trim();
    const environmentId = String(formData.get("environmentId") ?? "").trim();

    if (Boolean(companyId) !== Boolean(environmentId)) {
      setError(
        "Ingresa ambos identificadores de empresa y entorno, o deja ambos vacíos.",
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const session = await apiClient.login({
        identifier,
        password,
        ...(companyId ? { companyId, environmentId } : {}),
      });
      applySession(session);
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo iniciar sesión. Inténtalo nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    setIsSubmitting(true);
    try {
      await apiClient.logout();
      setUser(null);
      setAccessToken(null);
      setExpiresAt(null);
      setError("");
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cerrar la sesión.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadCompanies() {
    const data = await apiClient.list('companies');
    console.log(data);
  }

  const fullName = user
    ? [user.firstName, user.lastName, user.secondLastName]
      .filter((name): name is string => Boolean(name))
      .join(" ")
    : "";

  return (
    <main className="auth-page">
      <header className="brand">
        <div className="brand-mark" aria-hidden="true">
          L
        </div>
        <span>LibreERP</span>
      </header>

      <section className="auth-card" aria-live="polite">
        {isLoading ? (
          <div className="auth-loading" role="status">
            <span className="loading loading-spinner loading-md" />
            <p>Verificando tu sesión…</p>
          </div>
        ) : user ? (
          <div className="welcome-panel">
            <div className="welcome-icon" aria-hidden="true">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <p className="eyebrow">SESIÓN ACTIVA</p>
            <h1>¡Hola{fullName ? `, ${fullName}` : ""}!</h1>
            <p className="muted">{user.email}</p>
            <div className="workspace-info">
              <span>Empresa</span>
              <code>{user.companyId}</code>
              <span>Entorno</span>
              <code>{user.environmentId}</code>
            </div>
            <button
              className="button button-secondary"
              type="button"
              onClick={handleLogout}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>
        ) : (
          <>
            <div className="auth-heading">
              <p className="eyebrow">BIENVENIDO DE NUEVO</p>
              <h1>Iniciar sesión</h1>
              <p className="muted">
                Ingresa tus credenciales para acceder a LibreERP.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleLogin}>
              <label htmlFor="identifier">Correo electrónico o usuario</label>
              <input
                autoComplete="username"
                id="identifier"
                name="identifier"
                placeholder="nombre@empresa.com"
                required
                type="text"
              />

              <label htmlFor="password">Contraseña</label>
              <input
                autoComplete="current-password"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
              />

              <details className="tenant-fields">
                <summary>¿Tienes varias empresas o entornos?</summary>
                <p>
                  Completa ambos identificadores solo si tu usuario existe en
                  más de una empresa.
                </p>
                <label htmlFor="companyId">ID de empresa</label>
                <input
                  autoComplete="off"
                  id="companyId"
                  name="companyId"
                  placeholder="UUID de la empresa"
                  type="text"
                />
                <label htmlFor="environmentId">ID de entorno</label>
                <input
                  autoComplete="off"
                  id="environmentId"
                  name="environmentId"
                  placeholder="UUID del entorno"
                  type="text"
                />
              </details>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="button button-primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Ingresando…" : "Ingresar"}
              </button>
            </form>
          </>
        )}

        {isLoading && error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>

      <button className="btn mt-2 btn-primary" onClick={loadCompanies}>Load</button>

      <footer className="auth-footer">
        Acceso seguro a tu espacio de trabajo
      </footer>
    </main>
  );
}
