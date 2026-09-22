import { authorizeUrl, createPkce, oauthRedirectUri } from "./pkce";
import { oauthProvider, type OAuthProvider } from "./providers";
import { useOAuth } from "./store";

export type StartOAuthInput = {
  provider: OAuthProvider;
  clientId: string;
  clientSecret?: string | null;
};

export async function startOAuth({ provider, clientId, clientSecret }: StartOAuthInput) {
  const id = clientId.trim();
  if (!id) throw new Error("Client ID mangler");
  const pkce = await createPkce();
  const redirectUri = oauthRedirectUri();
  useOAuth.getState().savePending({
    providerId: provider.id,
    clientId: id,
    clientSecret: clientSecret?.trim() || null,
    verifier: pkce.verifier,
    state: pkce.state,
    redirectUri,
    authorizationEndpoint: provider.authorizationEndpoint,
    tokenEndpoint: provider.tokenEndpoint,
    userinfoEndpoint: provider.userinfoEndpoint,
    scopes: provider.scopes,
  });
  const url = authorizeUrl(provider.authorizationEndpoint, {
    clientId: id,
    redirectUri,
    scopes: provider.scopes,
    state: pkce.state,
    challenge: pkce.challenge,
  });
  const popup = window.open(url, "husjagt-oauth", "width=480,height=720");
  if (!popup) window.location.assign(url);
}

export function providerForForm(
  id: string,
  custom?: Partial<OAuthProvider>,
): OAuthProvider {
  const known = oauthProvider(id);
  if (known) return { ...known, ...custom, id: known.id };
  return {
    id: "custom",
    label: custom?.label || "Brugerdefineret",
    hint: "",
    authorizationEndpoint: custom?.authorizationEndpoint ?? "",
    tokenEndpoint: custom?.tokenEndpoint ?? "",
    userinfoEndpoint: custom?.userinfoEndpoint ?? null,
    scopes: custom?.scopes ?? "",
    needsSecret: true,
  };
}
