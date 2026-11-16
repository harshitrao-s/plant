import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Log in · Mini Project Manager",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-screen">Loading…</main>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
