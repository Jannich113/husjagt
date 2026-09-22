import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/account/login-form";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Opret konto · Husjagt" }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 py-12">
      <LoginForm />
    </main>
  );
}
