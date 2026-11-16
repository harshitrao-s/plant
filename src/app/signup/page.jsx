import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Sign up · Mini Project Manager",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="auth-screen">Loading…</main>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
