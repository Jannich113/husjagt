import { KeyRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { moduleOn } from "@/lib/hunt/modules";
import { exchangeOAuthCode } from "@/lib/oauth/exchange";
import { startOAuth } from "@/lib/oauth/flow";
import { OAUTH_PROVIDERS } from "@/lib/oauth/providers";
import { oauthRedirectUri } from "@/lib/oauth/pkce";
import { connectionStatus, useOAuth } from "@/lib/oauth/store";
import { redactToken } from "@/lib/oauth/tokens";
import { cn } from "@/lib/utils";

export function ConnectionsSheet() {
  const [open, setOpen] = useState(false);
  const hydrate = useOAuth((s) => s.hydrate);
  const connections = useOAuth((s) => s.connections);
  const disconnect = useOAuth((s) => s.disconnect);
  const upsert = useOAuth((s) => s.upsert);
  const takePending = useOAuth((s) => s.takePending);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const redirect = typeof window !== "undefined" ? oauthRedirectUri() : "/oauth/callback";

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; code?: string; state?: string; error?: string };
      if (data?.type !== "husjagt-oauth") return;
      const pending = takePending();
      if (!pending || data.error || !data.code || pending.state !== data.state) {
        setNotice("Login blev afbrudt.");
        setBusy(null);
        return;
      }
      setBusy(pending.providerId);
      void exchangeOAuthCode({
        data: {
          tokenUrl: pending.tokenEndpoint,
          userinfoUrl: pending.userinfoEndpoint,
          clientId: pending.clientId,
          clientSecret: pending.clientSecret,
          code: data.code,
          verifier: pending.verifier,
          redirectUri: pending.redirectUri,
        },
      })
        .then((tokens) => {
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
          setNotice(null);
        })
        .catch(() => setNotice("Token-byt mislykkedes."))
        .finally(() => setBusy(null));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [takePending, upsert]);

  if (!moduleOn("oauth")) return null;
  const connected = connections.length;

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm"
          aria-label="Forbundne konti"
        >
          <KeyRound className="size-4" />
          Konti{connected ? ` (${connected})` : ""}
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[80] bg-fg/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[90dvh] flex-col rounded-t-2xl border border-border bg-bg">
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border" />
          <div className="flex items-center justify-between px-4 py-3">
            <Drawer.Title className="font-display text-2xl">Forbindelser</Drawer.Title>
            <Drawer.Close className="flex size-10 items-center justify-center rounded-full hover:bg-sunken" aria-label="Luk">
              <X className="size-5" />
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
            <p className="text-sm text-muted">
              OAuth 2.0 med PKCE. Tokens gemmes kun på denne enhed. Redirect URI:{" "}
              <code className="break-all text-xs text-fg">{redirect}</code>
            </p>
            {notice ? <p className="mt-2 text-sm text-danger">{notice}</p> : null}
            <ul className="mt-4 space-y-3">
              {OAUTH_PROVIDERS.map((provider) => {
                const row = connections.find((item) => item.providerId === provider.id);
                return (
                  <li key={provider.id} className="rounded-xl border border-border bg-surface p-3">
                    <ProviderCard
                      providerId={provider.id}
                      label={provider.label}
                      hint={provider.hint}
                      needsSecret={provider.needsSecret}
                      connected={row}
                      busy={busy === provider.id}
                      onConnect={async (clientId, clientSecret) => {
                        setBusy(provider.id);
                        setNotice(null);
                        try {
                          await startOAuth({ provider, clientId, clientSecret });
                        } catch (err) {
                          setNotice(err instanceof Error ? err.message : "Kunne ikke starte login");
                          setBusy(null);
                        }
                      }}
                      onDisconnect={() => disconnect(provider.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function ProviderCard({
  providerId,
  label,
  hint,
  needsSecret,
  connected,
  busy,
  onConnect,
  onDisconnect,
}: {
  providerId: string;
  label: string;
  hint: string;
  needsSecret: boolean;
  connected?: ReturnType<typeof useOAuth.getState>["connections"][number];
  busy: boolean;
  onConnect: (clientId: string, clientSecret: string | null) => void;
  onDisconnect: () => void;
}) {
  const [clientId, setClientId] = useState(connected?.clientId ?? "");
  const [secret, setSecret] = useState(connected?.clientSecret ?? "");
  const status = connected ? connectionStatus(connected) : null;

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{label}</p>
          <p className="mt-0.5 text-xs text-muted">{hint}</p>
        </div>
        {status ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              status === "ok" ? "bg-good text-primary-fg" : "bg-warn text-primary-fg",
            )}
          >
            {status === "ok" ? connected?.accountLabel || "Forbundet" : "Udløbet"}
          </span>
        ) : null}
      </div>
      {connected ? (
        <p className="mt-2 text-xs text-muted">Token {redactToken(connected.accessToken)}</p>
      ) : null}
      <label className="mt-3 block text-xs text-muted">
        Client ID
        <input
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          autoComplete="off"
          className="mt-1 h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm"
        />
      </label>
      {needsSecret ? (
        <label className="mt-2 block text-xs text-muted">
          Client secret (kun på enheden)
          <input
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            type="password"
            autoComplete="off"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm"
          />
        </label>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onConnect(clientId, needsSecret ? secret : null)}
          className="h-10 rounded-full bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-50"
        >
          {busy ? "Forbinder…" : connected ? "Forbind igen" : "Forbind"}
        </button>
        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="h-10 rounded-full border border-border px-4 text-sm"
          >
            Fjern
          </button>
        ) : null}
      </div>
      <span className="sr-only">{providerId}</span>
    </div>
  );
}
