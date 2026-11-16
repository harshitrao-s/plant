"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { SESSION_COOKIE, getToken } from "@/lib/api";
import { bootstrapAuth } from "@/store/authSlice";
import { makeStore } from "@/store/store";

export function Providers({ children }) {
  const [store] = useState(makeStore);

  useEffect(() => {
    if (getToken()) {
      document.cookie = SESSION_COOKIE;
    }
    store.dispatch(bootstrapAuth());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
