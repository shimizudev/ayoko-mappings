// Sanitizes title, removes special characters and spaces, and converts to lowercase, removes unncessary words, and normalizes characters
export function sanitizeTitle(title: string): string {
  let sanitizedTitle = title.toLowerCase();

  sanitizedTitle = sanitizedTitle.replace(/\b(season|cour|part)\b/g, "");

  sanitizedTitle = sanitizedTitle.replace(/[^a-z0-9\s]/g, "");

  sanitizedTitle = sanitizedTitle
    .replace(/yuu/g, "yu")
    .replace(/ouh/g, "oh")
    .replace(/yaa/g, "ya");

  sanitizedTitle = sanitizedTitle.replace(
    /\b(uncut|uncensored|dub|censored|sub)\b/g,
    ""
  );

  sanitizedTitle = sanitizedTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return sanitizedTitle.trim().replace(/\s+/g, " ");
}
