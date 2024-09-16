import { Anilist } from "../providers/meta/anilist";
import { Gogoanime } from "../providers/anime/gogo";
import { findBestMatchedAnime, type StringMatchType } from "../title/similarity";
import type { Result, Title } from "../types/anime";
import { sanitizeTitle } from "../title/sanitizer";
import {
  ANIME,
  type IAnimeInfo,
  type IAnimeResult,
} from "@consumet/extensions";

export const getGogo = async (id: string) => {
  try {
    const gogo = new Gogoanime();
    const ani = new Anilist();

    const info = await ani.get(id);
    const title = info?.title;

    const response = await gogo.search(
      sanitizeTitle(title?.english ?? title?.romaji!)
    );
    const dub = response?.filter((r) => (r.title as string).includes("(Dub)"));
    const sub = response?.filter((r) => !(r.title as string).includes("(Dub)"));

    const bestSub = findBestMatchedAnime(
      title as Title,
      sub as unknown as Result[]
    );
    const bestDub =
      dub !== undefined || dub !== null || typeof dub === "object"
        ? findBestMatchedAnime(title as Title, dub as unknown as Result[])
        : { bestMatch: null, similarity: 0, index: -1, matchType: "fuzzy" };

    const subInfo = bestSub?.bestMatch
      ? getAnimeInfo(bestSub?.bestMatch.id)
      : Promise.resolve(null);
    const dubInfo = bestDub?.bestMatch
      ? getAnimeInfo(bestDub?.bestMatch.id)
      : Promise.resolve(null);

    const [subResult, dubResult] = await Promise.all([subInfo, dubInfo]);

    return {
      sub: {
        match: subResult,
        score: bestSub?.similarity,
        index: bestSub?.index,
        matchType: bestSub?.matchType as StringMatchType,
      },
      dub: {
        match: dubResult,
        score: bestDub?.similarity ?? 0,
        index: bestDub?.index ?? -1,
        matchType: bestSub?.matchType ?? ("fuzzy" as StringMatchType),
      },
    };
  } catch (error) {
    const defaultAnimeResult: IAnimeResult = {
      id: "",
      title: "",
      url: undefined,
      image: undefined,
      imageHash: undefined,
      cover: undefined,
      coverHash: undefined,
      status: undefined,
      rating: undefined,
      type: undefined,
      releaseDate: undefined,
    };
    const defaultAnimeInfo: IAnimeInfo = {
      ...defaultAnimeResult,
      malId: undefined,
      genres: [],
      description: undefined,
      status: undefined,
      totalEpisodes: undefined,
      subOrDub: undefined, // deprecated
      hasSub: false,
      hasDub: false,
      synonyms: [],
      countryOfOrigin: undefined,
      isAdult: false,
      isLicensed: false,
      season: undefined,
      studios: [],
      color: undefined,
      cover: undefined,
      trailer: {
        id: "",
        site: "",
        thumbnail: "",
      },
      episodes: [],
      startDate: {
        year: undefined,
        month: undefined,
        day: undefined,
      },
      endDate: {
        year: undefined,
        month: undefined,
        day: undefined,
      },
      recommendations: [],
      relations: [],
    };

    return {
      sub: {
        match: defaultAnimeInfo,
        score: 0,
        index: -1,
        matchType: "fuzzy" as StringMatchType,
      },
      dub: {
        match: defaultAnimeInfo,
        score: 0,
        index: -1,
        matchType: "fuzzy" as StringMatchType,
      },
    };
  }
};

const getAnimeInfo = async (id: string) => {
  const gg = new ANIME.Gogoanime();

  return await gg.fetchAnimeInfo(id);
};
