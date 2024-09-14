import { Kitsu, type AnimeData } from "../providers/meta/kitsu";
import { findBestMatchedAnime } from "../title/similarity";
import { sanitizeTitle } from "../title/sanitizer";
import { Anilist } from "../providers/meta/anilist";
import type { Title, Result } from "../types/anime";

export const getKitsu = async (id: string) => {
  try {
    const kitsu = new Kitsu();
    const ani = new Anilist();

    const info = await ani.get(id);
    const title = info?.title;

    let response = await kitsu.search(
      sanitizeTitle(title?.english || title?.romaji!)
    );

    const modifiedRes = response.data.map((res) => ({
      ...res,
      title:
        res.attributes.titles.en ||
        res.attributes.titles.en_jp ||
        res.attributes.titles.ja_jp,
    }));

    const best = findBestMatchedAnime(
      title as Title,
      modifiedRes as unknown as Result[]
    );

    return {
      match: best?.bestMatch as unknown as AnimeData & {
        sanitizedTitle: string;
        title: string;
      },
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
