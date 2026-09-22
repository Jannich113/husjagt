import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/account/login-form";
import { parseKontoNeed } from "@/lib/account/gate";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    need: parseKontoNeed(search.need),
  }),
  head: () => ({ meta: [{ title: "Opret konto · Husjagt" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { need } = Route.useSearch();
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 py-12">
      <LoginForm need={need} />
    </main>
  );
}
