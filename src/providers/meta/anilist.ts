import ky, { HTTPError, type KyResponse, type Options } from "ky";
import type { Format } from "./tvdb";
import fs from "fs/promises";

interface MediaQuery {
  Media: {
    bannerImage: string | null;
    coverImage: {
      extraLarge: string | null;
      large: string | null;
      medium: string | null;
      color: string | null;
    };
    description: string | null;
    averageScore: number | null;
    episodes: number | null;
    duration: number | null;
    endDate: {
      year: number | null;
      month: number | null;
      day: number | null;
    } | null;
    countryOfOrigin: string | null;
    format: Format | null;
    genres: string[];
    hashtag: string | null;
    id: number;
    idMal: number | null;
    season: string | null;
    status: string | null;
    synonyms: string[];
    studios: {
      edges: {
        id: number;
        isMain: boolean;
        node: {
          id: number;
          name: string;
        };
      }[];
    };
    title: {
      romaji: string | null;
      english: string | null;
      native: string | null;
      userPreferred: string | null;
    };
    type: string | null;
    updatedAt: number | null;
    tags: {
      id: number;
      name: string;
      category: string | null;
    }[];
    startDate: {
      year: number | null;
      month: number | null;
      day: number | null;
    } | null;
    nextAiringEpisode: {
      airingAt: number;
      episode: number;
      id: number;
      timeUntilAiring: number;
    } | null;
    characters: {
      edges: {
        id: number;
        role: string;
        node: {
          id: number;
          name: {
            full: string;
          };
          image: {
            large: string | null;
          };
        };
      }[];
    };
    relations: {
      edges: {
        relationType: string;
        node: {
          id: number;
          title: {
            romaji: string | null;
            english: string | null;
            native: string | null;
          };
        };
      }[];
    };
    popularity: number;
    trending: number;
  };
}

interface Character {
  id: number;
  role: string;
  name: string;
  image: string | null;
}

interface Relation {
  relationType: string;
  id: number;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
}

interface Studio {
  id: number;
  name: string;
  isMain: boolean;
}

interface Tag {
  id: number;
  name: string;
  category: string | null;
}

interface NextAiringEpisode {
  airingAt: number;
  episode: number;
  timeUntilAiring: number;
}

export interface MediaData {
  id: string;
  idMal: number | null;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
    userPreferred: string | null;
  };
  bannerImage: string | null;
  coverImage: string | null;
  color: string | null;
  description: string | null;
  averageScore: number | null;
  episodes: number | null;
  duration: number | null;
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  endDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  } | null;
  countryOfOrigin: string | null;
  format: Format | null;
  genres: string[];
  hashtag: string | null;
  season: string | null;
  status: string | null;
  synonyms: string[];
  studios: Studio[];
  tags: Tag[];
  nextAiringEpisode: NextAiringEpisode | null;
  characters: Character[];
  relations: Relation[];
  popularity: number;
  trending: number;
  updatedAt: number | null;
}

export class Anilist {
  private apiUrl: string = "https://graphql.anilist.co";
  private maxRetries: number = 10;
  private proxies: string[] = [];

  constructor(url?: string) {
    this.apiUrl = url ? url : this.apiUrl;
  }

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

  async get(id: string) {
    try {
      const res = await this.request(this.apiUrl, {
        method: "POST",
        json: {
          query: /* GraphQL */  `query ($mediaId: Int, $isMain: Boolean) {
                    Media(id: $mediaId) {
                      bannerImage
                      coverImage {
                        extraLarge
                        large
                        medium
                        color
                      }
                      description
                      averageScore
                      episodes
                      duration
                      endDate {
                        year
                        month
                        day
                      }
                      countryOfOrigin
                      format
                      genres
                      hashtag
                      id
                      idMal
                      season
                      status
                      synonyms
                      studios(isMain: $isMain) {
                        edges {
                          id
                          isMain
                          node {
                            id
                            name
                          }
                        }
                      }
                      title {
                        romaji
                        english
                        native
                        userPreferred
                      }
                      type
                      updatedAt
                      tags {
                        id
                        name
                        category
                      }
                      startDate {
                        year
                        month
                        day
                      }
                      nextAiringEpisode {
                        airingAt
                        episode
                        id
                        timeUntilAiring
                      }
                      characters {
                        edges {
                          id
                          role
                          node {
                            id
                            name {
                              full
                            }
                            image {
                              large
                            }
                          }
                        }
                      }
                      relations {
                        edges {
                          relationType
                          node {
                            id
                            title {
                              romaji
                              english
                              native
                            }
                          }
                        }
                      }
                      popularity
                      trending
                    }
                  }`,
          variables: {
            mediaId: id,
            isMain: true,
          },
        },
      });

      const json = await res.json<{ data: MediaQuery }>();

      const media = json.data.Media;

      return {
        id: String(media.id),
        idMal: media.idMal,
        title: media.title,
        bannerImage: media.bannerImage,
        coverImage:
          media.coverImage.extraLarge ??
          media.coverImage.large ??
          media.coverImage.medium,
        color: media.coverImage.color,
        description: media.description,
        averageScore: media.averageScore,
        episodes: media.episodes,
        duration: media.duration,
        startDate: media.startDate,
        endDate: media.endDate,
        countryOfOrigin: media.countryOfOrigin,
        format: media.format,
        genres: media.genres,
        hashtag: media.hashtag,
        season: media.season,
        status: media.status,
        synonyms: media.synonyms,
        studios: media.studios.edges.map((edge) => ({
          id: edge.node.id,
          name: edge.node.name,
          isMain: edge.isMain,
        })),
        tags: media.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          category: tag.category,
        })),
        nextAiringEpisode: media.nextAiringEpisode
          ? {
              airingAt: media.nextAiringEpisode.airingAt,
              episode: media.nextAiringEpisode.episode,
              timeUntilAiring: media.nextAiringEpisode.timeUntilAiring,
            }
          : null,
        characters: media.characters.edges.map((char) => ({
          id: char.node.id,
          role: char.role,
          name: char.node.name.full,
          image: char.node.image.large,
        })),
        relations: media.relations.edges.map((relation) => ({
          relationType: relation.relationType,
          id: relation.node.id,
          title: relation.node.title,
        })),
        popularity: media.popularity,
        trending: media.trending,
        updatedAt: media.updatedAt,
      } as MediaData;
    } catch (error) {
      return null;
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
      if ((error as HTTPError).response?.status === 429) {
        const retryAfter = (error as HTTPError).response.headers.get(
          "retry-after"
        );
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 3000; // default to 3 seconds if no retry-after header
        console.log(
          `Rate limit hit. Retrying after ${delay / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request(url, requestInit, retries + 1);
      } else {
        throw new Error(
          `Request failed with status ${
            (error as HTTPError).response?.status || "unknown"
          }`
        );
      }
    }
  }
}
