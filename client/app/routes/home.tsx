import { useEffect, useState, type FormEvent } from "react";
import type { Route } from "./+types/home";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);

interface AuthenticatedUser {
  id: string;
  companyId: string;
  environmentId: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  secondLastName: string | null;
}

interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

let refreshInFlight: Promise<AuthResponse | null> | null = null;

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    typeof user.companyId === "string" &&
    typeof user.environmentId === "string" &&
    typeof user.username === "string" &&
    typeof user.email === "string" &&
    (typeof user.firstName === "string" || user.firstName === null) &&
    (typeof user.lastName === "string" || user.lastName === null) &&
    (typeof user.secondLastName === "string" || user.secondLastName === null)
  );
}

function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Record<string, unknown>;
  return (
    typeof response.accessToken === "string" &&
    typeof response.expiresIn === "number" &&
    response.expiresIn > 0 &&
    isAuthenticatedUser(response.user)
  );
}

async function responseError(response: Response): Promise<string> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return `Error del servidor (${response.status})`;
  }
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
      return message.join(", ");
    }
  }
  return `Error del servidor (${response.status})`;
}

function requestRefresh(): Promise<AuthResponse | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (response.status === 401) return null;
      if (!response.ok) {
        throw new Error(await responseError(response));
      }
      const payload: unknown = await response.json();
      if (!isAuthResponse(payload)) {
        throw new Error("Respuesta de autenticación inválida");
      }
      return payload;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export function meta({}: Route.MetaArgs) {
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

  function applySession(session: AuthResponse) {
    setUser(session.user);
    setAccessToken(session.accessToken);
    setExpiresAt(Date.now() + session.expiresIn * 1000);
    setError("");
  }

  useEffect(() => {
    let active = true;
    requestRefresh()
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
      requestRefresh()
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
      setError("Ingresa ambos identificadores de empresa y entorno, o deja ambos vacíos.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          password,
          ...(companyId ? { companyId, environmentId } : {}),
        }),
      });
      if (!response.ok) {
        throw new Error(await responseError(response));
      }
      const payload: unknown = await response.json();
      if (!isAuthResponse(payload)) {
        throw new Error("Respuesta de autenticación inválida");
      }
      applySession(payload);
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
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      });
      if (!response.ok) {
        throw new Error(await responseError(response));
      }
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

      <footer className="auth-footer">
        Acceso seguro a tu espacio de trabajo
      </footer>
    </main>
  );
}
