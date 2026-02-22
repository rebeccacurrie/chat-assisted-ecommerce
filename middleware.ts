/**
 * Vercel Edge Middleware — basic auth on all routes.
 * Credentials come from BASIC_AUTH_USER / BASIC_AUTH_PASSWORD env vars.
 * If the env vars are not set, auth is skipped (avoids lockout).
 */
export default function middleware(request: Request) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPwd = process.env.BASIC_AUTH_PASSWORD;

  // Skip auth if credentials aren't configured
  if (!expectedUser || !expectedPwd) {
    return;
  }

  // Allow robots.txt through so crawlers see the Disallow
  const url = new URL(request.url);
  if (url.pathname === "/robots.txt") {
    return;
  }

  const basicAuth = request.headers.get("authorization");

  if (basicAuth) {
    const [scheme, encoded] = basicAuth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      // Split on first colon only — password may contain ":"
      const idx = decoded.indexOf(":");
      const user = decoded.slice(0, idx);
      const pwd = decoded.slice(idx + 1);

      if (user === expectedUser && pwd === expectedPwd) {
        return; // authenticated — pass through
      }
    }
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: "/(.*)",
};
