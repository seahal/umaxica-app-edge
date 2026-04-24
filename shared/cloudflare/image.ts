export const DEFAULT_ALLOWED_IMAGE_HOSTS = 'images.unsplash.com, avatars.githubusercontent.com';

export function normalizeHostnames(rawHostnames: string | undefined): Set<string> {
  const hostnames = rawHostnames
    ? rawHostnames
        .split(',')
        .map((hostname) => hostname.trim().toLowerCase())
        .filter(Boolean)
    : [];

  return new Set(hostnames);
}

function isAllowedOrigin(requestUrl: string, parsedUrl: URL): boolean {
  const requestOrigin = new URL(requestUrl).origin.toLowerCase();
  return parsedUrl.origin.toLowerCase() === requestOrigin;
}

/**
 * Resolves and validates a user-provided image URL before it is fetched server-side.
 *
 * Relative URLs are resolved against the current request URL so local next/image
 * sources like `/logo.png` keep working.
 */
export function validateImageUrl(
  rawUrl: string,
  requestUrl: string,
  allowedHostnamesValue: string | undefined = process.env.ALLOWED_IMAGE_HOSTS ??
    DEFAULT_ALLOWED_IMAGE_HOSTS,
): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl, requestUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  if (parsed.username || parsed.password) {
    return null;
  }

  if (isAllowedOrigin(requestUrl, parsed)) {
    return parsed.toString();
  }

  const allowedHostnames = normalizeHostnames(allowedHostnamesValue);
  if (!allowedHostnames.has(parsed.hostname.toLowerCase())) {
    return null;
  }

  return parsed.toString();
}

export function isAllowedImageFetchTarget(
  candidateUrl: string,
  requestUrl: string,
  allowedHostnamesValue: string | undefined = process.env.ALLOWED_IMAGE_HOSTS ??
    DEFAULT_ALLOWED_IMAGE_HOSTS,
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(candidateUrl);
  } catch {
    return false;
  }

  if (isAllowedOrigin(requestUrl, parsed)) {
    return true;
  }

  const allowedHostnames = normalizeHostnames(allowedHostnamesValue);
  return allowedHostnames.has(parsed.hostname.toLowerCase());
}
