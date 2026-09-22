import { create } from "zustand";
import type { OAuthProviderId } from "./providers";
import { tokenExpired, type TokenSet } from "./tokens";

export const OAUTH_KEY = "husjagt-oauth";
export const OAUTH_PENDING_KEY = "husjagt-oauth-pending";

export type OAuthConnection = {
  providerId: OAuthProviderId | string;
  clientId: string;
  clientSecret: string | null;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string | null;
  scopes?: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
  accountLabel: string | null;
  connectedAt: number;
};

export type OAuthPending = {
  providerId: string;
  clientId: string;
  clientSecret: string | null;
  verifier: string;
  state: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string | null;
  scopes: string;
};

type OAuthState = {
  ready: boolean;
  connections: OAuthConnection[];
  hydrate: () => void;
  upsert: (row: OAuthConnection) => void;
  disconnect: (providerId: string) => void;
  savePending: (pending: OAuthPending) => void;
  takePending: () => OAuthPending | null;
};

function canStore(): boolean {
  return typeof globalThis.localStorage?.getItem === "function";
}

function readConnections(): OAuthConnection[] {
  if (!canStore()) return [];
  try {
    const raw = globalThis.localStorage.getItem(OAUTH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { connections?: OAuthConnection[] };
    return Array.isArray(parsed.connections) ? parsed.connections : [];
  } catch {
    return [];
  }
}

function writeConnections(connections: OAuthConnection[]) {
  if (!canStore()) return;
  const safe = connections.map((row) => ({ ...row, clientSecret: null }));
  globalThis.localStorage.setItem(OAUTH_KEY, JSON.stringify({ connections: safe }));
}

export const useOAuth = create<OAuthState>((set, get) => ({
  ready: false,
  connections: [],
  hydrate: () => {
    if (get().ready) return;
    set({ connections: readConnections(), ready: true });
  },
  upsert: (row) => {
    const rest = get().connections.filter((item) => item.providerId !== row.providerId);
    const connections = [row, ...rest];
    writeConnections(connections);
    set({ connections, ready: true });
  },
  disconnect: (providerId) => {
    const connections = get().connections.filter((item) => item.providerId !== providerId);
    writeConnections(connections);
    set({ connections, ready: true });
  },
  savePending: (pending) => {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(OAUTH_PENDING_KEY, JSON.stringify(pending));
  },
  takePending: () => {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(OAUTH_PENDING_KEY);
    sessionStorage.removeItem(OAUTH_PENDING_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as OAuthPending;
    } catch {
      return null;
    }
  },
}));

export function connectionStatus(row: OAuthConnection): "ok" | "expired" {
  return tokenExpired(row.expiresAt) ? "expired" : "ok";
}

export function tokensFromConnection(row: OAuthConnection): TokenSet {
  return {
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    expiresAt: row.expiresAt,
    tokenType: "Bearer",
    accountLabel: row.accountLabel,
  };
}
