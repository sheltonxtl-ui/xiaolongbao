function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

/** Current browser origin — use for Supabase OAuth redirectTo (must be absolute). */
export function resolveBrowserOrigin(): string {
  if (typeof window === "undefined") {
    throw new Error("resolveBrowserOrigin must be called in the browser");
  }

  return window.location.origin;
}

/** Build an absolute redirect URL on the same host that received the request. */
export function redirectUrlFromRequest(request: Request, path: string): URL {
  return new URL(path, request.url);
}

function originFromRequest(request: Request): string | null {
  const url = new URL(request.url);

  // Prefer the actual request host during local development.
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return url.origin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const proto = forwardedProto ?? "https";
    return `${proto}://${forwardedHost}`;
  }

  return url.origin;
}

/** Resolve the public app URL for redirects and Stripe return URLs. */
export function resolveAppUrl(request?: Request): string {
  if (request) {
    const requestOrigin = originFromRequest(request);
    if (requestOrigin) {
      return trimTrailingSlash(requestOrigin);
    }
  }

  const configured = trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "");
  if (configured) {
    return configured;
  }

  const siteUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "");
  if (siteUrl) {
    return siteUrl;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? trimTrailingSlash(vercelUrl) : `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}
