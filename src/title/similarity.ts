import stringSimilarity from "string-similarity";
import { sanitizeTitle } from "./sanitizer";
import type { Result } from "../types/anime";

interface Title {
  english: string | null;
  romaji: string | null;
  native: string | null;
  userPreferred: string;
}

interface MatchResult {
  index: number;
  similarity: number;
  bestMatch: Result;
  matchType: "strict" | "fuzzy";
}

export function findBestMatchedAnime(
  title: Title | undefined,
  titles: Result[] | undefined
): MatchResult | null {
  if (!title || !titles || titles.length === 0) {
    return null;
  }

  const sanitizedTitleOptions = [
    sanitizeTitle(title.romaji ?? ""),
    sanitizeTitle(title.english ?? ""),
    sanitizeTitle(title.native ?? ""),
    sanitizeTitle(title.userPreferred ?? ""),
  ].filter(Boolean);

  if (sanitizedTitleOptions.length === 0) {
    return null;
  }

  const sanitizedResults = titles.map((result) => ({
    ...result,
    sanitizedTitle: sanitizeTitle(result.title as string),
  }));

  // First check for strict matches (works mostly with title sanitized, 90% of the time is strict matches)
  for (let i = 0; i < sanitizedResults.length; i++) {
    if (sanitizedTitleOptions.includes(sanitizedResults[i].sanitizedTitle)) {
      return {
        index: i,
        similarity: 1,
        bestMatch: sanitizedResults[i],
        matchType: "strict",
      };
    }
  }

  let bestMatchIndex = -1;
  let highestSimilarity = 0;

  // Using fuzzy match (it works when strict match doesn't work)
  sanitizedResults.forEach((result, index) => {
    const bestMatch = stringSimilarity.findBestMatch(
      result.sanitizedTitle,
      sanitizedTitleOptions
    );

    if (bestMatch.bestMatch.rating > highestSimilarity) {
      highestSimilarity = bestMatch.bestMatch.rating;
      bestMatchIndex = index;
    }
  });

  if (bestMatchIndex === -1) {
    return null;
  }

  return {
    index: bestMatchIndex,
    similarity: highestSimilarity,
    bestMatch: sanitizedResults[bestMatchIndex],
    matchType: "fuzzy",
  };
}
