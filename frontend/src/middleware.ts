import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/", 
  "/sign-in(.*)", 
  "/sign-up(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is public, allow access
  if (isPublic(req)) {
    return NextResponse.next();
  }

  // For protected routes, require authentication
  const authResult = await auth();
  
  if (!authResult.userId) {
    // Redirect to sign-in if not authenticated
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)" // apply to everything except static files
  ],
};
