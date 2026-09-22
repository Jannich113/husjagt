import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { tokenUrlAllowed } from "./ssrf";
import { parseTokenResponse } from "./tokens";

const inputSchema = z.object({
  tokenUrl: z.string().url().max(300),
  userinfoUrl: z.string().url().max(300).nullable(),
  clientId: z.string().min(1).max(200),
  clientSecret: z.string().max(200).nullable(),
  code: z.string().min(1).max(2048),
  verifier: z.string().min(1).max(128),
  redirectUri: z.string().url().max(300),
});

function accountLabelFrom(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const data = rec.data && typeof rec.data === "object" ? (rec.data as Record<string, unknown>) : rec;
  const email = typeof rec.email === "string" ? rec.email : typeof data.email === "string" ? data.email : null;
  const login = typeof rec.login === "string" ? rec.login : null;
  const name = typeof rec.name === "string" ? rec.name : typeof data.name === "string" ? data.name : null;
  const username = typeof rec.username === "string" ? rec.username : null;
  return email || login || username || name;
}

export const exchangeOAuthCode = createServerFn({ method: "POST" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    if (!tokenUrlAllowed(data.tokenUrl)) {
      throw new Error("Token-adressen er ikke tilladt");
    }
    if (data.userinfoUrl && !tokenUrlAllowed(data.userinfoUrl)) {
      throw new Error("Profil-adressen er ikke tilladt");
    }
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: data.code,
      client_id: data.clientId,
      redirect_uri: data.redirectUri,
      code_verifier: data.verifier,
    });
    if (data.clientSecret) body.set("client_secret", data.clientSecret);

    const response = await fetch(data.tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const raw: unknown = await response.json().catch(() => null);
    const tokens = parseTokenResponse(raw);
    if (!tokens) {
      throw new Error("Udbyderen sendte ikke et access token");
    }

    let accountLabel = tokens.accountLabel;
    if (data.userinfoUrl && tokens.accessToken) {
      try {
        const profile = await fetch(data.userinfoUrl, {
          headers: { Accept: "application/json", Authorization: `Bearer ${tokens.accessToken}` },
        });
        if (profile.ok) accountLabel = accountLabelFrom(await profile.json()) ?? accountLabel;
      } catch {
        /* label is optional */
      }
    }
    return { ...tokens, accountLabel };
  });
