/**
 * Convert a workspace name into a URL-safe ASCII slug.
 * Vietnamese accents are decomposed and stripped before punctuation is normalized.
 * @param {string} value
 * @returns {string}
 */
export function slugifyWorkspaceName(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
}
