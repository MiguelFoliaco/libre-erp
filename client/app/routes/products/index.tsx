import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiClient } from "../../../lib/sdk";
import { text } from "../../../modules/language";
import { ProductsPage } from "../../../modules/products";

export default function Products() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "authenticated" | "error">("checking");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    apiClient.restoreSession()
      .then((session) => {
        if (!active) return;
        if (session) setStatus("authenticated");
        else navigate("/", { replace: true });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : text("modules.products.messages.sessionFailed"));
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [attempt, navigate]);

  if (status === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
        <span className="sr-only">{text("modules.products.messages.checkingSession")}</span>
      </main>
    );
  }
  if (status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p role="alert">{error}</p>
        <button className="btn btn-primary" type="button" onClick={() => {
          setError("");
          setStatus("checking");
          setAttempt((current) => current + 1);
        }}>
          {text("modules.products.messages.retry")}
        </button>
      </main>
    );
  }
  return <ProductsPage />;
}
