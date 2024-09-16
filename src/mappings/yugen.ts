import { Anilist } from "../providers/meta/anilist";
import { Yugenanime } from "../providers/anime/yugen";
import {
  findBestMatchedAnime,
  type StringMatchType,
} from "../title/similarity";
import type { Result, Title } from "../types/anime";
import { sanitizeTitle } from "../title/sanitizer";

export const getYugen = async (id: string) => {
  try {
    const ya = new Yugenanime();
    const ani = new Anilist();

    const info = await ani.get(id);
    const title = info?.title;

    const response = await ya.search(sanitizeTitle(title?.userPreferred!));

    const best = findBestMatchedAnime(
      title as Title,
      response as unknown as Result[]
    );

    return {
      match: best?.bestMatch,
      score: best?.similarity,
      index: best?.index,
      matchType: best?.matchType as StringMatchType,
    };
  } catch (error) {
    return {
      match: {
        id: null,
        title: "",
        poster: "",
        url: "",
      },
      score: 0,
      index: -1,
      matchType: "fuzzy" as StringMatchType,
    };
  }
};
