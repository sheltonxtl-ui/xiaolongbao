export function suggestTitleFromUrl(input: string): string {
  try {
    const url = new URL(input.trim());
    if (url.hostname.toLowerCase().includes("docs.google.com")) {
      return "Google Doc deck";
    }
    const segment = url.pathname.split("/").filter(Boolean).pop();
    if (segment) {
      const decoded = decodeURIComponent(segment).replace(/\.[^.]+$/, "");
      if (decoded) {
        return decoded.length > 72 ? `${decoded.slice(0, 69)}…` : decoded;
      }
    }
    return url.hostname;
  } catch {
    return "Imported deck";
  }
}
