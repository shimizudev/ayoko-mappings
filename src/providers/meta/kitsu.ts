import ky, { type KyResponse, type Options } from "ky";

export class Kitsu {
  private apiUrl: string = "https://kitsu.app/api";

  async search(query: string) {
    const res = await this.request(
      `${this.apiUrl}/edge/anime?filter[text]=${encodeURIComponent(query)}`
    );

    const data = await res.json<AnimeResponse>();

    return data;
  }

  async request(
    url: URL | string,
    requestInit: Options = {},
    retries = 0
  ): Promise<KyResponse<unknown>> {
    const instance = ky.create();

    const response = await instance(url, requestInit);

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 3000; // default to 3 seconds if no retry-after header
        console.log(
          `Rate limit hit. Retrying after ${delay / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request(url, requestInit, retries + 1) as Promise<
          KyResponse<unknown>
        >;
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    const remainingRequests = response.headers.get("x-ratelimit-remaining");
    const resetTime = response.headers.get("x-ratelimit-reset");

    if (remainingRequests && parseInt(remainingRequests) <= 60 && resetTime) {
      const delay = parseInt(resetTime) * 1000 - Date.now();
      console.log(
        `Approaching rate limit. Waiting for ${delay / 1000} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.request(url, requestInit, retries) as Promise<
        KyResponse<unknown>
      >;
    }

    return response;
  }

}

interface AnimeAttributes {
  createdAt: string;
  updatedAt: string;
  slug: string;
  synopsis: string;
  description: string;
  coverImageTopOffset: number;
  titles: {
    en: string;
    en_jp: string;
    ja_jp: string;
  };
  canonicalTitle: string;
  abbreviatedTitles: string[];
  averageRating: string | null;
  ratingFrequencies: {
    [key: string]: string;
  };
  userCount: number;
  favoritesCount: number;
  startDate: string;
  endDate: string | null;
  nextRelease: string | null;
  popularityRank: number;
  ratingRank: number | null;
  ageRating: string;
  ageRatingGuide: string;
  subtype: string;
  status: string;
  tba: string | null;
  posterImage: {
    tiny: string;
    large: string;
    small: string;
    medium: string;
    original: string;
    meta: {
      dimensions: {
        tiny: { width: number; height: number };
        large: { width: number; height: number };
        small: { width: number; height: number };
        medium: { width: number; height: number };
      };
    };
  };
  coverImage: {
    tiny: string;
    large: string;
    small: string;
    original: string;
    meta: {
      dimensions: {
        tiny: { width: number; height: number };
        large: { width: number; height: number };
        small: { width: number; height: number };
      };
    };
  } | null;
  episodeCount: number;
  episodeLength: number | null;
  totalLength: number;
  youtubeVideoId: string | null;
  showType: string;
  nsfw: boolean;
}

interface AnimeRelationships {
  genres: { links: { self: string; related: string } };
  categories: { links: { self: string; related: string } };
  castings: { links: { self: string; related: string } };
  installments: { links: { self: string; related: string } };
  mappings: { links: { self: string; related: string } };
  reviews: { links: { self: string; related: string } };
  mediaRelationships: { links: { self: string; related: string } };
  characters: { links: { self: string; related: string } };
  staff: { links: { self: string; related: string } };
  productions: { links: { self: string; related: string } };
  quotes: { links: { self: string; related: string } };
  episodes: { links: { self: string; related: string } };
  streamingLinks: { links: { self: string; related: string } };
  animeProductions: { links: { self: string; related: string } };
  animeCharacters: { links: { self: string; related: string } };
  animeStaff: { links: { self: string; related: string } };
}

export interface AnimeData {
  id: string;
  type: string;
  links: {
    self: string;
  };
  attributes: AnimeAttributes;
  relationships: AnimeRelationships;
}

interface AnimeResponse {
  data: AnimeData[];
}
