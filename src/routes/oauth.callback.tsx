import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { exchangeOAuthCode } from "@/lib/oauth/exchange";
import { useOAuth } from "@/lib/oauth/store";

export const Route = createFileRoute("/oauth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : "",
    state: typeof search.state === "string" ? search.state : "",
    error: typeof search.error === "string" ? search.error : "",
  }),
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const { code, state, error } = Route.useSearch();
  const navigate = useNavigate();
  const upsert = useOAuth((s) => s.upsert);
  const takePending = useOAuth((s) => s.takePending);
  const [message, setMessage] = useState("Forbinder…");

  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage({ type: "husjagt-oauth", code, state, error }, window.location.origin);
      setMessage("Du kan lukke vinduet.");
      window.close();
      return;
    }
    const pending = takePending();
    if (error) {
      setMessage("Login blev afbrudt.");
      return;
    }
    if (!pending || !code || pending.state !== state) {
      setMessage("Sessionen er udløbet. Prøv at forbinde igen.");
      return;
    }
    let alive = true;
    void exchangeOAuthCode({
      data: {
        tokenUrl: pending.tokenEndpoint,
        userinfoUrl: pending.userinfoEndpoint,
        clientId: pending.clientId,
        clientSecret: pending.clientSecret,
        code,
        verifier: pending.verifier,
        redirectUri: pending.redirectUri,
      },
    })
      .then((tokens) => {
        if (!alive) return;
        upsert({
          providerId: pending.providerId,
          clientId: pending.clientId,
          clientSecret: pending.clientSecret,
          authorizationEndpoint: pending.authorizationEndpoint,
          tokenEndpoint: pending.tokenEndpoint,
          userinfoEndpoint: pending.userinfoEndpoint,
          scopes: pending.scopes,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          accountLabel: tokens.accountLabel,
          connectedAt: Date.now(),
        });
        void navigate({ to: "/" });
      })
      .catch(() => {
        if (alive) setMessage("Token-byt mislykkedes. Tjek client id og redirect URI.");
      });
    return () => {
      alive = false;
    };
  }, [code, error, navigate, state, takePending, upsert]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Husjagt</p>
      <h1 className="mt-2 font-display text-3xl">OAuth</h1>
      <p className="mt-3 text-sm text-muted">{message}</p>
    </main>
  );
}
