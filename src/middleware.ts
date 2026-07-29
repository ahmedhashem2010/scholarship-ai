import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that must never be gated, because they are how a session gets
 * established in the first place. Checking auth on these would lock people out
 * of the very flow that unlocks them.
 */
const alwaysPublic = ["/auth/callback", "/auth/confirm", "/auth/verify"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (alwaysPublic.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() revalidates the JWT against Supabase's auth server on every call.
  // getSession() only decodes the cookie, which a client can forge — it must
  // never back an authorization decision. See the Supabase SSR docs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isHome = pathname === "/";
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuth = pathname.startsWith("/auth");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isAdmin = pathname.startsWith("/admin");

  // --- Returning students land in the product, not the pitch ---------------
  //
  // Someone already signed in has no use for the marketing homepage. `?home=1`
  // is a deliberate escape hatch so the landing page stays reachable while
  // logged in — needed for demos, screenshots and the competition video, where
  // being unable to show your own homepage would be absurd.
  if (isHome) {
    if (user && !request.nextUrl.searchParams.has("home")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Unauthenticated users cannot reach protected areas.
  if (!user && (isDashboard || isOnboarding || isAdmin)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    // Preserve intent so login can send them back where they were headed.
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // --- Unverified accounts stay out of the product -------------------------
  //
  // Belt and braces. Supabase already refuses password sign-in for unconfirmed
  // users *when* "Confirm email" is enabled in the project settings — but that
  // is a dashboard toggle nothing in this repo controls, and if it ever gets
  // switched off the entire verification flow becomes decorative. This check
  // does not depend on it.
  if (user && !user.email_confirmed_at && (isDashboard || isOnboarding || isAdmin)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/verify";
    url.search = "";
    if (user.email) url.searchParams.set("email", user.email);
    return NextResponse.redirect(url);
  }

  // Admin area is restricted to a single configured address.
  if (isAdmin) {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const userEmail = user?.email?.toLowerCase().trim();

    if (!adminEmail || !userEmail || userEmail !== adminEmail) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Signed-in users have no reason to sit on login or signup.
  //
  // This branch was previously unreachable: /auth/login and /auth/signup were
  // in the early-return list above, so the check below never ran and a
  // logged-in user could stare at a login form indefinitely.
  if (user && isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/auth/:path*", "/onboarding", "/admin/:path*"],
};
