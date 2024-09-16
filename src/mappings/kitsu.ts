import { Kitsu, type AnimeData } from "../providers/meta/kitsu";
import {
  findBestMatchedAnime,
  type StringMatchType,
} from "../title/similarity";
import { sanitizeTitle } from "../title/sanitizer";
import { Anilist } from "../providers/meta/anilist";
import type { Title, Result } from "../types/anime";

type KitsuReturn = AnimeData & {
  sanitizedTitle: string;
  title: string;
};

export const getKitsu = async (id: string) => {
  try {
    const kitsu = new Kitsu();
    const ani = new Anilist();

    const info = await ani.get(id);
    const title = info?.title;

    let response = await kitsu.search(
      sanitizeTitle(title?.english ?? title?.romaji!)
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
      match: best?.bestMatch as unknown as KitsuReturn,
      score: best?.similarity,
      index: best?.index,
      matchType: best?.matchType as StringMatchType,
    };
  } catch (error) {
    return {
      match: {
        id: "",
        type: "",
        links: {
          self: "",
        },
        attributes: {
          createdAt: "",
          updatedAt: "",
          slug: "",
          synopsis: "",
          description: "",
          coverImageTopOffset: 0,
          titles: {
            en: "",
            en_jp: "",
            ja_jp: "",
          },
          canonicalTitle: "",
          abbreviatedTitles: [],
          averageRating: null,
          ratingFrequencies: {},
          userCount: 0,
          favoritesCount: 0,
          startDate: "",
          endDate: null,
          nextRelease: null,
          popularityRank: 0,
          ratingRank: null,
          ageRating: "",
          ageRatingGuide: "",
          subtype: "",
          status: "",
          tba: null,
          posterImage: {
            tiny: "",
            large: "",
            small: "",
            medium: "",
            original: "",
            meta: {
              dimensions: {
                tiny: { width: 0, height: 0 },
                large: { width: 0, height: 0 },
                small: { width: 0, height: 0 },
                medium: { width: 0, height: 0 },
              },
            },
          },
          coverImage: {
            tiny: "",
            large: "",
            small: "",
            original: "",
            meta: {
              dimensions: {
                tiny: { width: 0, height: 0 },
                large: { width: 0, height: 0 },
                small: { width: 0, height: 0 },
              },
            },
          },
          episodeCount: 0,
          episodeLength: null,
          totalLength: 0,
          youtubeVideoId: null,
          showType: "",
          nsfw: false,
        },
        relationships: {
          genres: { links: { self: "", related: "" } },
          categories: { links: { self: "", related: "" } },
          castings: { links: { self: "", related: "" } },
          installments: { links: { self: "", related: "" } },
          mappings: { links: { self: "", related: "" } },
          reviews: { links: { self: "", related: "" } },
          mediaRelationships: { links: { self: "", related: "" } },
          characters: { links: { self: "", related: "" } },
          staff: { links: { self: "", related: "" } },
          productions: { links: { self: "", related: "" } },
          quotes: { links: { self: "", related: "" } },
          episodes: { links: { self: "", related: "" } },
          streamingLinks: { links: { self: "", related: "" } },
          animeProductions: { links: { self: "", related: "" } },
          animeCharacters: { links: { self: "", related: "" } },
          animeStaff: { links: { self: "", related: "" } },
        },
        title: "",
        sanitizedTitle: "",
      } as KitsuReturn,
      score: 0,
      index: -1,
      matchType: "fuzzy" as StringMatchType,
    };
  }
};
