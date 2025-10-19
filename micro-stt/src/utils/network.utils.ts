/**
 * Network-related utility functions
 */

/**
 * Checks if the given URL hostname is a private or loopback address
 * @param url - URL to check
 * @returns true if the hostname is private, false otherwise
 */
export function isPrivateHost(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }
  // Basic heuristic for private networks
  // More comprehensive checks would require DNS/IP resolution
  return false;
}
