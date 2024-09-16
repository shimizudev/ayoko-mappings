import { load, type CheerioAPI, type SelectorType } from "cheerio";
import type { Result } from "../../types/anime";
import BaseProvider from "./base";
import ky, { type Options, type KyResponse, HTTPError } from "ky";
import fs from "fs/promises";

export interface Anime {
  id: string | null;
  name: string | null;
  jname: string | null;
  poster: string | null;
  duration: string | null;
  type: string | null;
  rating: string | null;
  episodes: {
    sub: number | null;
    dub: number | null;
  };
}

type CommonAnimeProps = "id" | "name" | "poster";

export interface Top10Anime extends Pick<Anime, CommonAnimeProps | "episodes"> {
  rank: number | null;
  jname: string | null;
}

export type Top10AnimeTimePeriod = "day" | "week" | "month";

export interface MostPopularAnime
  extends Pick<Anime, CommonAnimeProps | "episodes" | "type"> {
  jname: string | null;
}

export interface SpotlightAnime
  extends MostPopularAnime,
    Pick<Top10Anime, "rank"> {
  description: string | null;
  otherInfo: string[];
}

export interface TrendingAnime
  extends Pick<Anime, CommonAnimeProps | "jname">,
    Pick<Top10Anime, "rank"> {}

export interface LatestEpisodeAnime extends Anime {}

export interface TopUpcomingAnime extends Anime {}

export interface TopAiringAnime extends MostPopularAnime {}
export interface MostFavoriteAnime extends MostPopularAnime {}
export interface LatestCompletedAnime extends MostPopularAnime {}

export interface AnimeGeneralAboutInfo
  extends Pick<Anime, CommonAnimeProps>,
    Pick<SpotlightAnime, "description"> {
  anilistId: number | null;
  malId: number | null;
  stats: {
    quality: string | null;
  } & Pick<Anime, "duration" | "episodes" | "rating" | "type">;
  promotionalVideos: AnimePromotionalVideo[];
  charactersVoiceActors: AnimeCharactersAndVoiceActors[];
}

export interface RecommendedAnime extends Anime {}

export interface RelatedAnime extends MostPopularAnime {}

export interface Season extends Pick<Anime, CommonAnimeProps> {
  isCurrent: boolean;
  title: string | null;
}

export interface AnimePromotionalVideo {
  title: string | undefined;
  source: string | undefined;
  thumbnail: string | undefined;
}

export interface AnimeCharactersAndVoiceActors {
  character: AnimeCharacter;
  voiceActor: AnimeCharacter;
}

export interface AnimeCharacter {
  id: string;
  poster: string;
  name: string;
  cast: string;
}

export interface AnimeSearchSuggestion
  extends Omit<MostPopularAnime, "episodes" | "type"> {
  moreInfo: Array<string>;
}

export interface AnimeEpisode extends Pick<Season, "title"> {
  episodeId: string | null;
  number: number;
  isFiller: boolean;
}

export interface SubEpisode {
  serverName: string;
  serverId: number | null;
}
export interface DubEpisode extends SubEpisode {}
export interface RawEpisode extends SubEpisode {}

export type AnimeCategories =
  | "most-favorite"
  | "most-popular"
  | "subbed-anime"
  | "dubbed-anime"
  | "recently-updated"
  | "recently-added"
  | "top-upcoming"
  | "top-airing"
  | "movie"
  | "special"
  | "ova"
  | "ona"
  | "tv"
  | "completed";

export type AnimeServers =
  | "hd-1"
  | "hd-2"
  | "megacloud"
  | "streamsb"
  | "streamtape";

export enum Servers {
  VidStreaming = "hd-1",
  MegaCloud = "megacloud",
  StreamSB = "streamsb",
  StreamTape = "streamtape",
  VidCloud = "hd-2",
  AsianLoad = "asianload",
  GogoCDN = "gogocdn",
  MixDrop = "mixdrop",
  UpCloud = "upcloud",
  VizCloud = "vizcloud",
  MyCloud = "mycloud",
  Filemoon = "filemoon",
}

export type AnimeSearchQueryParams = {
  q?: string;
  page?: string;
  type?: string;
  status?: string;
  rated?: string;
  score?: string;
  season?: string;
  language?: string;
  start_date?: string;
  end_date?: string;
  sort?: string;
  genres?: string;
};

export type SearchFilters = Omit<AnimeSearchQueryParams, "q" | "page">;

export type FilterKeys = Partial<
  keyof Omit<SearchFilters, "start_date" | "end_date">
>;

export interface ScrapedAnimeSearchResult
  extends Pick<ScrapedAnimeCategory, CommonAnimeScrapeTypes> {
  mostPopularAnimes: Array<MostPopularAnime>;
  searchQuery: string;
  searchFilters: SearchFilters;
}
export interface ScrapedAnimeCategory {
  animes: Array<Anime>;
  genres: Array<string>;
  top10Animes: {
    today: Array<Top10Anime>;
    week: Array<Top10Anime>;
    month: Array<Top10Anime>;
  };
  category: string;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
}

export type CommonAnimeScrapeTypes =
  | "animes"
  | "totalPages"
  | "hasNextPage"
  | "currentPage";

export interface ScrapedAnimeAboutInfo
  extends Pick<ScrapedAnimeSearchResult, "mostPopularAnimes"> {
  anime: {
    info: AnimeGeneralAboutInfo;
    moreInfo: Record<string, string | string[]>;
  };
  seasons: Array<Season>;
  relatedAnimes: Array<RelatedAnime>;
  recommendedAnimes: Array<RecommendedAnime>;
}

export interface ScrapedAnimeEpisodes {
  totalEpisodes: number;
  episodes: Array<AnimeEpisode>;
}

export const extractAnimes = (
  $: CheerioAPI,
  selector: SelectorType,
  scraperName: string
): Array<Anime> => {
  try {
    const animes: Array<Anime> = [];

    $(selector).each((_, el) => {
      const animeId =
        $(el)
          .find(".film-detail .film-name .dynamic-name")
          ?.attr("href")
          ?.slice(1)
          .split("?ref=search")[0] || null;

      animes.push({
        id: animeId,
        name: $(el)
          .find(".film-detail .film-name .dynamic-name")
          ?.text()
          ?.trim(),
        jname:
          $(el)
            .find(".film-detail .film-name .dynamic-name")
            ?.attr("data-jname")
            ?.trim() || null,
        poster:
          $(el)
            .find(".film-poster .film-poster-img")
            ?.attr("data-src")
            ?.trim() || null,
        duration: $(el)
          .find(".film-detail .fd-infor .fdi-item.fdi-duration")
          ?.text()
          ?.trim(),
        type: $(el)
          .find(".film-detail .fd-infor .fdi-item:nth-of-type(1)")
          ?.text()
          ?.trim(),
        rating: $(el).find(".film-poster .tick-rate")?.text()?.trim() || null,
        episodes: {
          sub:
            Number(
              $(el)
                .find(".film-poster .tick-sub")
                ?.text()
                ?.trim()
                .split(" ")
                .pop()
            ) || null,
          dub:
            Number(
              $(el)
                .find(".film-poster .tick-dub")
                ?.text()
                ?.trim()
                .split(" ")
                .pop()
            ) || null,
        },
      });
    });

    return animes;
  } catch (err: any) {
    console.log(err);

    return [] as Anime[];
  }
};

export const extractMostPopularAnimes = (
  $: CheerioAPI,
  selector: SelectorType,
  scraperName: string
): Array<MostPopularAnime> => {
  try {
    const animes: Array<MostPopularAnime> = [];

    $(selector).each((_, el) => {
      animes.push({
        id:
          $(el)
            .find(".film-detail .dynamic-name")
            ?.attr("href")
            ?.slice(1)
            .trim() || null,
        name: $(el).find(".film-detail .dynamic-name")?.text()?.trim() || null,
        jname:
          $(el)
            .find(".film-detail .film-name .dynamic-name")
            .attr("data-jname")
            ?.trim() || null,
        poster:
          $(el)
            .find(".film-poster .film-poster-img")
            ?.attr("data-src")
            ?.trim() || null,
        episodes: {
          sub:
            Number($(el)?.find(".fd-infor .tick .tick-sub")?.text()?.trim()) ||
            null,
          dub:
            Number($(el)?.find(".fd-infor .tick .tick-dub")?.text()?.trim()) ||
            null,
        },
        type:
          $(el)
            ?.find(".fd-infor .tick")
            ?.text()
            ?.trim()
            ?.replace(/[\s\n]+/g, " ")
            ?.split(" ")
            ?.pop() || null,
      });
    });

    return animes;
  } catch (err: any) {
    console.error(err);

    return [] as MostPopularAnime[];
  }
};

export class Hianime extends BaseProvider {
  override url: string = "https://hianime.to";
  override name: string = "Hianime";
  private ajxUrl: string = `${this.url}/ajax`;
  private maxRetries: number = 10;
  private proxies: string[] = [];

  async loadProxies() {
    const data = await fs.readFile("workingProxies.json", "utf-8");
    const content = (await JSON.parse(data)) as {
      providerId: string;
      ip: string;
    }[];
    this.proxies = content.map((proxy) => `http://${proxy.ip}`);
  }

  private async getRandomProxy() {
    await this.loadProxies();
    if (this.proxies.length === 0) {
      throw new Error("No proxies available");
    }
    const randomIndex = Math.floor(Math.random() * this.proxies.length);
    return this.proxies[randomIndex];
  }

  constructor(url?: string) {
    super();
    this.url = url ? url : this.url;
  }

  override async search(
    query: string
  ): Promise<(Result & { episodes?: number; duration: string })[] | undefined> {
    const res = await this.request(
      `${this.url}/search?keyword=${encodeURIComponent(query)}`
    );
    const body = await res.text();

    const $ = load(body);

    const result: (Result & { episodes?: number; duration: string })[] = [];

    $(".film_list-wrap .flw-item").each((_, el) => {
      const $el = $(el);

      const title = $el.find(".film-name").text().trim() ?? "";
      const poster = $el.find(".film-poster img").attr("data-src") ?? "";
      const url = $el.find(".film-name a").attr("href") ?? "";
      const id = url?.split("/").pop()?.split("?ref=").shift() ?? "";
      const episodes = Number(
        $el.find(".film-poster .tick-item.tick-sub").text().trim()
      );
      const duration = $el.find(".fdi-item.fdi-duration").text().trim();

      result.push({
        id,
        title,
        poster,
        url: `${this.url}${url}`,
        episodes: episodes,
        duration: duration,
      });
    });

    return result;
  }

  async getInfo(animeId: string) {
    const res: ScrapedAnimeAboutInfo = {
      anime: {
        info: {
          id: null,
          anilistId: null,
          malId: null,
          name: null,
          poster: null,
          description: null,
          stats: {
            rating: null,
            quality: null,
            episodes: {
              sub: null,
              dub: null,
            },
            type: null,
            duration: null,
          },
          promotionalVideos: [],
          charactersVoiceActors: [],
        },
        moreInfo: {},
      },
      seasons: [],
      mostPopularAnimes: [],
      relatedAnimes: [],
      recommendedAnimes: [],
    };

    const animeUrl: URL = new URL(animeId, this.url);
    const mainPage = await this.request(animeUrl.href);

    const $: CheerioAPI = load(await mainPage.text());

    try {
      res.anime.info.anilistId = Number(
        JSON.parse($("body")?.find("#syncData")?.text())?.anilist_id
      );
      res.anime.info.malId = Number(
        JSON.parse($("body")?.find("#syncData")?.text())?.mal_id
      );
    } catch (err) {
      res.anime.info.anilistId = null;
      res.anime.info.malId = null;
    }

    const selector: SelectorType = "#ani_detail .container .anis-content";

    res.anime.info.id =
      $(selector)
        ?.find(".anisc-detail .film-buttons a.btn-play")
        ?.attr("href")
        ?.split("/")
        ?.pop() || null;
    res.anime.info.name =
      $(selector)
        ?.find(".anisc-detail .film-name.dynamic-name")
        ?.text()
        ?.trim() || null;
    res.anime.info.description =
      $(selector)
        ?.find(".anisc-detail .film-description .text")
        .text()
        ?.split("[")
        ?.shift()
        ?.trim() || null;
    res.anime.info.poster =
      $(selector)?.find(".film-poster .film-poster-img")?.attr("src")?.trim() ||
      null;

    // stats
    res.anime.info.stats.rating =
      $(`${selector} .film-stats .tick .tick-pg`)?.text()?.trim() || null;
    res.anime.info.stats.quality =
      $(`${selector} .film-stats .tick .tick-quality`)?.text()?.trim() || null;
    res.anime.info.stats.episodes = {
      sub:
        Number($(`${selector} .film-stats .tick .tick-sub`)?.text()?.trim()) ||
        null,
      dub:
        Number($(`${selector} .film-stats .tick .tick-dub`)?.text()?.trim()) ||
        null,
    };
    res.anime.info.stats.type =
      $(`${selector} .film-stats .tick`)
        ?.text()
        ?.trim()
        ?.replace(/[\s\n]+/g, " ")
        ?.split(" ")
        ?.at(-2) || null;
    res.anime.info.stats.duration =
      $(`${selector} .film-stats .tick`)
        ?.text()
        ?.trim()
        ?.replace(/[\s\n]+/g, " ")
        ?.split(" ")
        ?.pop() || null;

    // get promotional videos
    $(
      ".block_area.block_area-promotions .block_area-promotions-list .screen-items .item"
    ).each((_, el) => {
      res.anime.info.promotionalVideos.push({
        title: $(el).attr("data-title"),
        source: $(el).attr("data-src"),
        thumbnail: $(el).find("img").attr("src"),
      });
    });

    // get characters and voice actors
    $(
      ".block_area.block_area-actors .block-actors-content .bac-list-wrap .bac-item"
    ).each((_, el) => {
      res.anime.info.charactersVoiceActors.push({
        character: {
          id:
            $(el)
              .find($(".per-info.ltr .pi-avatar"))
              .attr("href")
              ?.split("/")[2] || "",
          poster:
            $(el).find($(".per-info.ltr .pi-avatar img")).attr("data-src") ||
            "",
          name: $(el).find($(".per-info.ltr .pi-detail a")).text(),
          cast: $(el).find($(".per-info.ltr .pi-detail .pi-cast")).text(),
        },
        voiceActor: {
          id:
            $(el)
              .find($(".per-info.rtl .pi-avatar"))
              .attr("href")
              ?.split("/")[2] || "",
          poster:
            $(el).find($(".per-info.rtl .pi-avatar img")).attr("data-src") ||
            "",
          name: $(el).find($(".per-info.rtl .pi-detail a")).text(),
          cast: $(el).find($(".per-info.rtl .pi-detail .pi-cast")).text(),
        },
      });
    });

    // more information
    $(`${selector} .anisc-info-wrap .anisc-info .item:not(.w-hide)`).each(
      (_, el) => {
        let key = $(el)
          .find(".item-head")
          .text()
          .toLowerCase()
          .replace(":", "")
          .trim();
        key = key.includes(" ") ? key.replace(" ", "") : key;

        const value = [
          ...$(el)
            .find("*:not(.item-head)")
            .map((_, el) => $(el).text().trim()),
        ]
          .map((i) => `${i}`)
          .toString()
          .trim();

        if (key === "genres") {
          res.anime.moreInfo[key] = value.split(",").map((i) => i.trim());
          return;
        }
        if (key === "producers") {
          res.anime.moreInfo[key] = value.split(",").map((i) => i.trim());
          return;
        }
        res.anime.moreInfo[key] = value;
      }
    );

    // more seasons
    const seasonsSelector: SelectorType = "#main-content .os-list a.os-item";
    $(seasonsSelector).each((_, el) => {
      res.seasons.push({
        id: $(el)?.attr("href")?.slice(1)?.trim() || null,
        name: $(el)?.attr("title")?.trim() || null,
        title: $(el)?.find(".title")?.text()?.trim(),
        poster:
          $(el)
            ?.find(".season-poster")
            ?.attr("style")
            ?.split(" ")
            ?.pop()
            ?.split("(")
            ?.pop()
            ?.split(")")[0] || null,
        isCurrent: $(el).hasClass("active"),
      });
    });

    const relatedAnimeSelector: SelectorType =
      "#main-sidebar .block_area.block_area_sidebar.block_area-realtime:nth-of-type(1) .anif-block-ul ul li";
    res.relatedAnimes = extractMostPopularAnimes(
      $,
      relatedAnimeSelector,
      this.getInfo.name
    );

    const mostPopularSelector: SelectorType =
      "#main-sidebar .block_area.block_area_sidebar.block_area-realtime:nth-of-type(2) .anif-block-ul ul li";
    res.mostPopularAnimes = extractMostPopularAnimes(
      $,
      mostPopularSelector,
      this.getInfo.name
    );

    const recommendedAnimeSelector: SelectorType =
      "#main-content .block_area.block_area_category .tab-content .flw-item";
    res.recommendedAnimes = extractAnimes(
      $,
      recommendedAnimeSelector,
      this.getInfo.name
    );

    return res;
  }

  async getAnimeEpisodes(animeId: string): Promise<ScrapedAnimeEpisodes> {
    const res: ScrapedAnimeEpisodes = {
      totalEpisodes: 0,
      episodes: [],
    };

    try {
      const episodesAjax = await this.request(
        `${this.ajxUrl}/v2/episode/list/${animeId.split("-").pop()}`,
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Referer: `${this.url}/watch/${animeId}`,
          },
        }
      );

      const $: CheerioAPI = load(
        (await episodesAjax.json<{ html: string }>()).html
      );

      res.totalEpisodes = Number($(".detail-infor-content .ss-list a").length);

      $(".detail-infor-content .ss-list a").each((_, el) => {
        res.episodes.push({
          title: $(el)?.attr("title")?.trim() || null,
          episodeId: $(el)?.attr("href")?.split("/")?.pop() || null,
          number: Number($(el).attr("data-number")),
          isFiller: $(el).hasClass("ssl-item-filler"),
        });
      });

      return res;
    } catch (err: any) {
      console.log(err);

      return { episodes: [], totalEpisodes: 0 };
    }
  }

  async request(
    url: URL | string,
    requestInit: Options = {},
    retries = 0
  ): Promise<KyResponse<unknown>> {
    if (retries >= this.maxRetries) {
      throw new Error("Max retries reached");
    }

    const instance = ky.create();

    const proxyUrl = await this.getRandomProxy();
    const proxiedUrl = `${proxyUrl}/${url}`;

    try {
      const response = await instance(proxiedUrl, {
        ...requestInit,
        headers: { ...requestInit.headers, Origin: "https://ayoko.fun" },
      });

      const remainingRequests = response.headers.get("x-ratelimit-remaining");
      const resetTime = response.headers.get("x-ratelimit-reset");

      if (remainingRequests && parseInt(remainingRequests) <= 60 && resetTime) {
        const resetTimeInMs = parseInt(resetTime) * 1000;
        const delay = resetTimeInMs - Date.now();
        if (delay > 0) {
          console.log(
            `Approaching rate limit. Waiting for ${delay / 1000} seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.request(url, requestInit, retries);
        }
      }

      return response;
    } catch (error) {
      const status = (error as HTTPError)?.response?.status;

      // If status code is 429 (Rate Limit) or other errors (like 5xx)
      if (status === 429) {
        const retryAfter = (error as HTTPError).response.headers.get(
          "retry-after"
        );
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 3000; // default to 3 seconds
        console.log(
          `Rate limit hit. Retrying after ${delay / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request(url, requestInit, retries + 1);
      } else if (status && (status >= 500 || status >= 400)) {
        console.log(`Request failed with status ${status}. Retrying...`);
        return this.request(url, requestInit, retries + 1);
      } else {
        throw new Error(
          `Request failed with status ${status || "unknown"} on ${
            (error as HTTPError).request.url
          }`
        );
      }
    }
  }
}
