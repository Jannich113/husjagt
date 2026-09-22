import { useState, type FormEvent, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function LoginForm() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return <div className="h-40 animate-pulse rounded-2xl bg-sunken" />;
  }
  if (user) return <Navigate to="/" />;
  if (!authEnabled) return <p className="text-sm text-muted">Konto er slået fra.</p>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const mail = email.trim();
    const pass = password.trim();
    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({
          email: mail,
          password: pass,
          name: name.trim() || mail.split("@")[0] || "Jæger",
        });
        if (result.error) throw new Error(result.error.message || "Kunne ikke oprette konto");
      } else {
        const result = await authClient.signIn.email({ email: mail, password: pass });
        if (result.error) throw new Error(result.error.message || "Forkert e-mail eller adgangskode");
      }
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noget gik galt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Husjagt</p>
      <h1 className="mt-2 font-display text-4xl">{mode === "signup" ? "Opret konto" : "Log ind"}</h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "signup"
          ? "En konto gemmer dine hjerter, noter og overvågninger på sitet."
          : "Velkommen tilbage. Data følger kontoen, ikke kun telefonen."}
      </p>

      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-3">
        {mode === "signup" ? (
          <Field label="Navn">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
            />
          </Field>
        ) : null}
        <Field label="E-mail">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
          />
        </Field>
        <Field label="Adgangskode">
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
          />
        </Field>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-fg disabled:opacity-50"
        >
          {busy ? "Vent…" : mode === "signup" ? "Opret konto" : "Log ind"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
        }}
        className="mt-4 h-11 w-full text-sm text-muted"
      >
        {mode === "signup" ? "Har du allerede en konto? Log ind" : "Ny her? Opret konto"}
      </button>

      <div className="mt-8 border-t border-border pt-5">
        <p className="mb-3 text-center text-xs uppercase tracking-wider text-muted">Eller</p>
        <div className="flex flex-col gap-2">
          {GROK_PROVIDERS.map((provider) => (
            <button
              key={provider.providerId}
              type="button"
              onClick={() => signIn(provider.providerId, { callbackURL: "/" })}
              className="h-11 w-full rounded-full border border-border bg-surface text-sm font-medium"
            >
              Fortsæt med {provider.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function RequireAccount({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <p className="text-sm text-muted">Tjekker konto…</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <>{children}</>;
}
