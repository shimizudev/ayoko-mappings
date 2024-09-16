import stringSimilarity from "string-similarity";
import { sanitizeTitle } from "./sanitizer";
import type { Result } from "../types/anime";

interface Title {
  english: string | null;
  romaji: string | null;
  native: string | null;
  userPreferred: string;
}

export type StringMatchType = "strict" | "loose" | "fuzzy";

interface MatchResult {
  index: number;
  similarity: number;
  bestMatch: Result;
  matchType: StringMatchType;
}

const SIMILARITY_THRESHOLD = 0.7;

export function findBestMatchedAnime(
  title: Title | undefined,
  titles: Result[] | undefined
): MatchResult | null {
  if (!isValidInput(title, titles)) return null;

  const sanitizedTitleOptions = getSanitizedTitleOptions(title!);
  if (sanitizedTitleOptions.length === 0) return null;

  const sanitizedResults = getSanitizedResults(titles!);

  const strictMatch = findStrictMatch(sanitizedTitleOptions, sanitizedResults);
  if (strictMatch) return strictMatch;

  const looseMatch = findLooseMatch(sanitizedTitleOptions, sanitizedResults);
  if (looseMatch) return looseMatch;

  return findFuzzyMatch(sanitizedTitleOptions, sanitizedResults);
}

function isValidInput(
  title: Title | undefined,
  titles: Result[] | undefined
): boolean {
  return !!title && !!titles && titles.length > 0;
}

function getSanitizedTitleOptions(title: Title): string[] {
  return [title.romaji, title.english, title.native, title.userPreferred]
    .filter((t): t is string => !!t)
    .map(sanitizeTitle);
}

function getSanitizedResults(
  titles: Result[]
): (Result & { sanitizedTitle: string })[] {
  return titles.map((result) => ({
    ...result,
    sanitizedTitle: sanitizeTitle(result.title as string),
  }));
}

function findStrictMatch(
  sanitizedTitleOptions: string[],
  sanitizedResults: (Result & { sanitizedTitle: string })[]
): MatchResult | null {
  for (let i = 0; i < sanitizedResults.length; i++) {
    if (sanitizedTitleOptions.includes(sanitizedResults[i].sanitizedTitle)) {
      return createMatchResult(i, 1, sanitizedResults[i], "strict");
    }
  }
  return null;
}

function findLooseMatch(
  sanitizedTitleOptions: string[],
  sanitizedResults: (Result & { sanitizedTitle: string })[]
): MatchResult | null {
  for (let i = 0; i < sanitizedResults.length; i++) {
    const sanitizedResult = sanitizedResults[i].sanitizedTitle;
    const isLooseMatch = sanitizedTitleOptions.some(
      (sanitizedTitle) =>
        sanitizedResult.includes(sanitizedTitle) ||
        sanitizedTitle.includes(sanitizedResult)
    );

    if (isLooseMatch) {
      return createMatchResult(i, 0.8, sanitizedResults[i], "loose");
    }
  }
  return null;
}

function findFuzzyMatch(
  sanitizedTitleOptions: string[],
  sanitizedResults: (Result & { sanitizedTitle: string })[]
): MatchResult | null {
  let bestMatchIndex = -1;
  let highestSimilarity = 0;

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

  if (highestSimilarity < SIMILARITY_THRESHOLD || bestMatchIndex === -1) {
    return null;
  }

  return createMatchResult(
    bestMatchIndex,
    highestSimilarity,
    sanitizedResults[bestMatchIndex],
    "fuzzy"
  );
}

function createMatchResult(
  index: number,
  similarity: number,
  bestMatch: Result & { sanitizedTitle: string },
  matchType: StringMatchType
): MatchResult {
  return { index, similarity, bestMatch, matchType };
}
