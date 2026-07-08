// HTTP Basic Auth check for the quick-launch gate. Pure and Edge-safe (uses the
// Web `atob`, available in the middleware runtime).
//
// This is a shared username/password stopgap so we can deploy and gather
// feedback before the Google SSO path is turned on. Deny-by-default: if the
// credentials are not configured, no one gets in.

export function verifyBasicAuth(
  authorizationHeader: string | null,
  expectedUser: string | undefined,
  expectedPassword: string | undefined,
): boolean {
  if (!expectedUser || !expectedPassword) return false;
  if (!authorizationHeader || !authorizationHeader.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(authorizationHeader.slice("Basic ".length).trim());
  } catch {
    return false;
  }

  const separator = decoded.indexOf(":");
  if (separator === -1) return false;

  const user = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);
  return user === expectedUser && password === expectedPassword;
}
