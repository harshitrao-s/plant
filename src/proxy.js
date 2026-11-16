import { NextResponse } from "next/server";

export function proxy(request) {
  const hasSession = request.cookies.get("pm_session")?.value === "1";
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/projects");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isProtected && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/projects/:path*", "/login", "/signup"],
};
