export type OAuthProviderId = "google" | "github" | "x" | "custom";

export type OAuthProvider = {
  id: OAuthProviderId;
  label: string;
  hint: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string | null;
  scopes: string;
  needsSecret: boolean;
};

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    id: "google",
    label: "Google",
    hint: "OpenID — e-mail og navn. Opret en Web-klient og sæt redirect til /oauth/callback.",
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    userinfoEndpoint: "https://openidconnect.googleapis.com/v1/userinfo",
    scopes: "openid email profile",
    needsSecret: false,
  },
  {
    id: "github",
    label: "GitHub",
    hint: "Erstatter en PAT til GitHub. OAuth-appen kræver client secret ved token-byt.",
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
    userinfoEndpoint: "https://api.github.com/user",
    scopes: "read:user",
    needsSecret: true,
  },
  {
    id: "x",
    label: "X",
    hint: "OAuth 2.0 med PKCE. Redirect skal matche appen på developer.x.com.",
    authorizationEndpoint: "https://twitter.com/i/oauth2/authorize",
    tokenEndpoint: "https://api.twitter.com/2/oauth2/token",
    userinfoEndpoint: "https://api.twitter.com/2/users/me",
    scopes: "users.read tweet.read offline.access",
    needsSecret: false,
  },
];

export function oauthProvider(id: string): OAuthProvider | undefined {
  return OAUTH_PROVIDERS.find((row) => row.id === id);
}
