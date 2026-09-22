import { useNavigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { KontoNeed } from "./gate";

export function useKonto() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();

  function requireKonto(need: KontoNeed, then?: () => void): boolean {
    if (isPending) return false;
    if (user) {
      then?.();
      return true;
    }
    void navigate({ to: "/login", search: { need } });
    return false;
  }

  return { user, isPending, signedIn: Boolean(user), requireKonto };
}
