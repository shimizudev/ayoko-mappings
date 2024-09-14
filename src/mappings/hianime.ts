import { Anilist } from "../providers/meta/anilist";
import { Hianime } from "../providers/anime/hianime";
import { findBestMatchedAnime } from "../title/similarity";
import type { Result, Title } from "../types/anime";
import { sanitizeTitle } from "../title/sanitizer";
import { ANIME } from "@consumet/extensions";

export const getHianime = async (id: string) => {
  try {
    const hi = new Hianime();
    const ani = new Anilist();

    const info = await ani.get(id);

    // Ugh I hate hianime for this...
    const title = {
      english:
        info?.title.english &&
        info?.title.english.toLowerCase().replaceAll("oshi no ko", "My Star"),
      romaji:
        info?.title.romaji &&
        info?.title.romaji.toLowerCase().replaceAll("oshi no ko", "My Star"),
      native:
        info?.title.native &&
        info?.title.native.toLowerCase().replaceAll("oshi no ko", "My Star"),
      userPreferred:
        info?.title.userPreferred &&
        info?.title.userPreferred
          .toLowerCase()
          .replaceAll("oshi no ko", "My Star"),
    };

    const response = await hi.search(sanitizeTitle(title.userPreferred!));

    const best = findBestMatchedAnime(
      title as Title,
      response as unknown as Result[]
    );

    const bestInfo = best?.bestMatch
      ? await getAnimeInfo(best?.bestMatch.id!)
      : null;

    return {
      match: bestInfo,
      score: best?.similarity,
      index: best?.index,
      matchType: best?.matchType,
    };
  } catch (error) {
    return {
      match: null,
      score: 0,
      index: -1,
      matchType: "fuzzy",
    };
  }
};

const getAnimeInfo = async (id: string) => {
  const zr = new ANIME.Zoro();

  return await zr.fetchAnimeInfo(id);
};
