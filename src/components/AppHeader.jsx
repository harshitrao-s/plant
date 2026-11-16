"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function AppHeader() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();

  return (
    <header className="topbar">
      <Link href="/projects" className="wordmark">
        Mini Project Manager
      </Link>
      <div className="topbar-user">
        <span>{user?.name}</span>
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            dispatch(logout());
            router.push("/");
          }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
