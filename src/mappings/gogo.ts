import { Anilist } from "../providers/meta/anilist";
import { Gogoanime } from "../providers/anime/gogo";
import {
  findBestMatchedAnime,
  type StringMatchType,
} from "../title/similarity";
import type { Result, Title } from "../types/anime";
import { sanitizeTitle } from "../title/sanitizer";
import {
  ANIME,
  MediaFormat,
  MediaStatus,
  SubOrSub,
  type IAnimeInfo,
  type IAnimeResult,
} from "@consumet/extensions";

export const getGogo = async (id: string) => {
  try {
    const gogo = new Gogoanime();
    const ani = new Anilist();

    const info = await ani.get(id);

    // I hate these all.... FUCK YOU GOGOANIME FOR HAVING SUCH A SHITTY TITLE PARSING
    const title = {
      english:
        info?.title.english &&
        info?.title.english
          .toLowerCase()
          .replaceAll("tower of god season 2", "Kami no Tou: Ouji no Kikan"),
      romaji:
        info?.title.romaji &&
        info?.title.romaji
          .toLowerCase()
          .replaceAll(
            "kami no tou: tower of god - ouji no kikan",
            "Kami no Tou: Ouji no Kikan"
          ),
      native:
        info?.title.native &&
        info?.title.native
          .toLowerCase()
          .replaceAll(
            "神之塔 -tower of god- 王子の帰還",
            "Kami no Tou: Ouji no Kikan"
          ),
      userPreferred:
        info?.title.userPreferred &&
        info?.title.userPreferred
          .toLowerCase()
          .replaceAll(
            "kami no tou: tower of god - ouji no kikan",
            "Kami no Tou: Ouji no Kikan"
          ),
    };

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
      url: "",
      image: "",
      imageHash: "",
      cover: "",
      coverHash: "",
      status: MediaStatus.UNKNOWN,
      rating: 0,
      type: MediaFormat.TV,
      releaseDate: undefined,
    };
    const defaultAnimeInfo: IAnimeInfo = {
      ...defaultAnimeResult,
      malId: "",
      genres: [],
      description: "",
      status: MediaStatus.UNKNOWN,
      totalEpisodes: 0,
      subOrDub: SubOrSub.SUB, // deprecated
      hasSub: false,
      hasDub: false,
      synonyms: [],
      countryOfOrigin: "",
      isAdult: false,
      isLicensed: false,
      season: "",
      studios: [],
      color: "",
      cover: "",
      trailer: {
        id: "",
        site: "",
        thumbnail: "",
      },
      episodes: [],
      startDate: {
        year: 0,
        month: 0,
        day: 0,
      },
      endDate: {
        year: 0,
        month: 0,
        day: 0,
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
