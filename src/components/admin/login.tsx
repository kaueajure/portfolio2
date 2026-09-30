"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/fields";
import { api } from "@/lib/client";
export function Login() {
  const [setup, setSetup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <>
      <h1>{setup ? "Definir senha" : "Entrar no painel"}</h1>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.currentTarget));
          setBusy(true);
          setError("");
          try {
            await api(`/api/auth/${setup ? "setup" : "login"}`, data);
            router.push("/admin/dashboard");
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={190}
        />
        <Field
          label="Senha"
          name="password"
          type="password"
          autoComplete={setup ? "new-password" : "current-password"}
          minLength={setup ? 12 : 1}
          maxLength={128}
          required
        />
        {setup ? (
          <>
            <Field
              label="Confirmar senha"
              name="passwordConfirm"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
            <Field
              label="Token de configuração"
              name="setupToken"
              type="password"
              autoComplete="off"
              required
            />
          </>
        ) : null}
        <p role="alert">{error}</p>
        <button className="primary" disabled={busy}>
          {busy ? "Aguarde…" : setup ? "Salvar senha e entrar" : "Entrar"}
        </button>
      </form>
      <button
        className="text-button"
        onClick={() => {
          setSetup(!setup);
          setError("");
        }}
        disabled={busy}
      >
        {setup ? "Voltar ao login" : "Primeiro acesso"}
      </button>
    </>
  );
}
