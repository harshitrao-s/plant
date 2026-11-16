"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { clearError, login, signup } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function AuthForm({ mode }) {
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.auth.error);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, mode]);

  async function onSubmit(event) {
    event.preventDefault();
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "");

    if (mode === "signup" && password !== String(form.get("confirm") || "")) {
      setFormError("Passwords do not match.");
      return;
    }

    setPending(true);
    const action =
      mode === "login"
        ? await dispatch(login({ email, password }))
        : await dispatch(signup({ name, email, password }));
    setPending(false);

    if (login.fulfilled.match(action) || signup.fulfilled.match(action)) {
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/projects") ? next : "/projects");
    }
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <Link href="/" className="wordmark">
          Mini Project Manager
        </Link>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">
          {mode === "login"
            ? "Log in to see the projects and tasks that belong to you."
            : "Your password is stored hashed, and the session runs on a JWT."}
        </p>
        <form className="stack" onSubmit={onSubmit}>
          {mode === "signup" && (
            <label>
              Name
              <input name="name" required minLength={2} placeholder="Asha Verma" />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" required placeholder="you@email.com" />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </label>
          {mode === "signup" && (
            <label>
              Confirm password
              <input name="confirm" type="password" required minLength={6} />
            </label>
          )}
          {(formError || error) && <p className="form-error">{formError || error}</p>}
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
        <p className="muted auth-switch">
          {mode === "login" ? (
            <>
              New here? <Link href="/signup">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link href="/login">Log in</Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
