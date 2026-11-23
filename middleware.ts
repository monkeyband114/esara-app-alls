import { withAuth } from "next-auth/middleware";

// Signed-out visitors are sent to /login (with a callbackUrl back to the page they wanted).
// Role checks happen in each page via requirePageUser(), which reads the user's current role from the database.
// Doing them here too would use the role saved in the session cookie, which goes stale when an admin changes it
// and would bounce the user between the middleware's and the page's idea of their dashboard.
export default withAuth({ pages: { signIn: "/login" } });

export const config = {
  matcher: ["/dashboard/:path*", "/research-discovery", "/onboarding"]
};
