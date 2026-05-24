import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req as any;
  const isLoggedIn = !!session;

  const isAuthRoute      = nextUrl.pathname.startsWith("/login");
  const isRegisterRoute  = nextUrl.pathname.startsWith("/register");
  const isApiRoute       = nextUrl.pathname.startsWith("/api");
  const isProtectedRoute = !isAuthRoute && !isRegisterRoute && !isApiRoute &&
                           nextUrl.pathname !== "/";

  // Protect all non-auth routes
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Redirect logged-in users away from login
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
