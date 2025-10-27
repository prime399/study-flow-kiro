import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server"
import { NextResponse } from "next/server"

const isSignInPage = createRouteMatcher(["/signin"])
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"])
const isAuth0Route = createRouteMatcher(["/api/auth/(.*)"])

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Let Auth0 routes pass through (handled by SDK)
  if (isAuth0Route(request)) {
    return NextResponse.next()
  }

  // Handle Convex auth routes
  if (isSignInPage(request) && convexAuth.isAuthenticated()) {
    return nextjsMiddlewareRedirect(request, "/dashboard")
  }
  if (isProtectedRoute(request) && !convexAuth.isAuthenticated()) {
    return nextjsMiddlewareRedirect(request, "/signin")
  }

  // For all other routes, return a standard response
  return NextResponse.next()
})

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
