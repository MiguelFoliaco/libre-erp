
import { useEffect, useState, type FormEvent } from "react";
import type { Route } from "./+types/home";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Globe2,
  KeyRound,
  Languages,
  Layers3,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  apiClient,
} from "@/lib/sdk";
import { text } from "@/modules/language";
import { useLanguage } from "@/modules/language/hook";
import { useSession } from "@/modules/auth/hook/store";
import { useNavigate } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Iniciar sesión | LibreERP" },
    { name: "description", content: "Accede a tu espacio de LibreERP." },
  ];
}

export default function Home() {
  const { user, setUser, setSession, error, setError, isLoading } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toggleLanguage } = useLanguage()
  const navigate = useNavigate()


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
        text("login.errors.company-not-input")
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

      setUser(session.user);
      setSession({ accessToken: session.accessToken, expiresAt: Date.now() + session.expiresIn * 1000 });
      setError("");
      navigate("/start");
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : text('login.errors.no-could-session')
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
      setSession({ accessToken: null, expiresAt: null });
      setError("");
    } catch (cause: unknown) {
      setError(
        cause instanceof Error
          ? cause.message
          : text('login.errors.no-could-logout')
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

  useEffect(() => {
    if (user) {
      navigate('/start')
    }
  }, [user])

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-3 sm:p-4">
      <div className="card lg:card-side bg-base-100 shadow-2xl w-full max-w-5xl max-h-[calc(100dvh-2rem)] overflow-y-auto lg:overflow-hidden">

        {/* Authentication panel */}
        <section className="card-body w-full lg:w-1/2 p-6 sm:p-8 lg:p-9 flex flex-col">

          <div className="mb-5">
            <img
              src="/light.png"
              alt="LibreERP"
              className="w-44 object-contain"
            />
          </div>

          <div className="flex-1 flex flex-col justify-center">

            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="text-sm text-base-content/60">
                  {text('login.validating')}
                </p>
              </div>
            ) : user ? (
              <div className="space-y-5">

                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-2xl w-14">
                    <span className="text-xl font-bold">
                      {user.username.slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="badge badge-success badge-outline gap-2 mb-3">
                    <CheckCircle2 size={13} />
                    {text('login.activeSession')}
                  </div>

                  <h1 className="text-2xl font-bold">
                    {text('login.hello')}{fullName ? `, ${fullName}` : ""}!
                  </h1>

                  <p className="text-sm text-base-content/60 mt-1">
                    {user.email}
                  </p>
                </div>

                <div className="divider my-1" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Building2 size={19} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-base-content/50">{text('login.bussiness')}</p>
                      <p className="text-sm font-medium break-all">
                        {user.companyId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Layers3 size={19} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-base-content/50">{text('login.env')}</p>
                      <p className="text-sm font-medium break-all">
                        {user.environmentId}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-outline btn-error w-full mt-3"
                  type="button"
                  onClick={handleLogout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <LogOut size={17} />
                  )}
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="space-y-5">

                <div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {text('firstScreen.title')}
                  </h1>

                  <p className="text-sm text-base-content/60 mt-2 leading-relaxed">
                    {text('login.subtitle')}
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-3">

                  <fieldset className="fieldset py-0">
                    <legend className="fieldset-legend text-xs">
                      {text('login.username')}
                    </legend>

                    <label className="input input-bordered input-sm w-full flex items-center gap-2">
                      <UserRound size={16} className="text-base-content/40" />

                      <input
                        autoComplete="username"
                        id="identifier"
                        name="identifier"
                        placeholder="nombre@empresa.com"
                        required
                        type="text"
                        className="grow"
                      />
                    </label>
                  </fieldset>

                  <fieldset className="fieldset py-0">
                    <legend className="fieldset-legend text-xs">
                      {text('login.password')}
                    </legend>

                    <label className="input input-bordered input-sm w-full flex items-center gap-2">
                      <KeyRound size={16} className="text-base-content/40" />

                      <input
                        autoComplete="current-password"
                        id="password"
                        name="password"
                        placeholder={text('login.placeholderPassword')}
                        required
                        type={showPassword ? "text" : "password"}
                        className="grow"
                      />

                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-square"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </label>
                  </fieldset>

                  {/* 
                  // Implements with select, request and key o validate any way
                  <div className="collapse collapse-arrow border border-base-300 rounded-box">
                    <input type="checkbox" />

                    <div className="collapse-title text-xs font-medium min-h-0 py-3 flex items-center gap-2">
                      <Building2 size={16} className="text-base-content/60" />
                      Configuración de empresa y entorno
                    </div>

                    <div className="collapse-content space-y-2">
                      <p className="text-xs text-base-content/60">
                        Completa ambos identificadores únicamente si tu usuario
                        pertenece a varias empresas.
                      </p>

                      <fieldset className="fieldset py-0">
                        <legend className="fieldset-legend text-xs">
                          ID de empresa
                        </legend>
                        <input
                          autoComplete="off"
                          id="companyId"
                          name="companyId"
                          placeholder="UUID de la empresa"
                          type="text"
                          className="input input-bordered input-sm w-full"
                        />
                      </fieldset>

                      <fieldset className="fieldset py-0">
                        <legend className="fieldset-legend text-xs">
                          ID de entorno
                        </legend>
                        <input
                          autoComplete="off"
                          id="environmentId"
                          name="environmentId"
                          placeholder="UUID del entorno"
                          type="text"
                          className="input input-bordered input-sm w-full"
                        />
                      </fieldset>
                    </div>
                  </div> */}

                  {error && (
                    <div className="alert alert-error text-xs py-2">
                      <ShieldCheck size={17} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-sm w-full"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        Ingresando...
                      </>
                    ) : (
                      <>
                        {text('login.sign-in')}
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>

                </form>
              </div>
            )}
          </div>

          {isLoading && error && (
            <div className="alert alert-error text-xs py-2 mt-3" role="alert">
              <ShieldCheck size={17} />
              <span>{error}</span>
            </div>
          )}

          <footer className="mt-5 pt-3 border-t border-base-300">
            <div className="flex items-center justify-center gap-2 text-xs text-base-content/50">
              {text('firstScreen.text-change-language-1')}
              <span onClick={toggleLanguage} className="cursor-pointer hover:underline font-medium text-primary">{text('firstScreen.text-change-language-2')}</span>
              <Languages size={14} className="text-primary" />
            </div>
          </footer>
        </section>

        {/* Branding panel */}
        <aside className="hidden lg:flex lg:w-1/2 bg-primary text-primary-content relative overflow-hidden flex-col justify-between p-8 xl:p-10">

          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full border-35 border-current" />
            <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full border-35 border-current" />
          </div>

          <div className="relative mb-3 z-10">
            <div className="badge badge-outline border-primary-content/40 text-primary-content gap-2">
              <Globe2 size={13} />
              ERP · Open Source
            </div>
          </div>

          <div className="relative z-10 space-y-5">

            <div className="bg-primary-content/10 rounded-2xl p-4 w-fit">
              <img
                src="/light.png"
                alt="LibreERP"
                className="w-48 object-contain brightness-0 invert"
              />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
                {text('firstScreen.right.title')}
                <br />
                {text('firstScreen.right.title2')}
              </h2>

              <p className="text-primary-content/75 text-sm xl:text-base leading-relaxed max-w-sm">
                {text('firstScreen.right.subtitle')}
              </p>
            </div>

            <div className="space-y-3 pt-2">

              <div className="flex items-center gap-3">
                <div className="bg-primary-content/15 rounded-lg p-2">
                  <Building2 size={18} />
                </div>
                <span className="text-sm">
                  {text('firstScreen.right.list.item-1')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-primary-content/15 rounded-lg p-2">
                  <Layers3 size={18} />
                </div>
                <span className="text-sm">
                  {text('firstScreen.right.list.item-2')}

                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-primary-content/15 rounded-lg p-2">
                  <Fingerprint size={18} />
                </div>
                <span className="text-sm">
                  {text('firstScreen.right.list.item-3')}

                </span>
              </div>

            </div>
          </div>

          <div className="relative mt-4 z-10 flex items-center justify-between text-xs text-primary-content/60">
            <span>LibreERP © {new Date().getFullYear()}</span>
            <span>Open source business management</span>
          </div>
        </aside>

      </div>
    </main>
  );

}
