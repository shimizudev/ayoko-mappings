import ky from "ky";
import fs from "fs/promises";

// Load proxies from the file and map them to HTTP URLs
const proxies = (
  JSON.parse(await fs.readFile("workingProxies.json", "utf-8")) as {
    providerId: string;
    ip: string;
  }[]
).map((proxy) => `http://${proxy.ip}`); // CORS proxy: prepend proxy before the AniList API URL

const ANILIST_API = "https://graphql.anilist.co";

// Interfaces for AniList responses
interface AnimeData {
  id: number;
  status:
    | "RELEASING"
    | "FINISHED"
    | "HIATUS"
    | "CANCELLED"
    | "NOT_YET_RELEASED";
}

interface TrendingAnimeResponse {
  data: {
    Page: {
      media: AnimeData[];
    };
  };
}

interface PopularAnimeResponse {
  data: {
    Page: {
      media: AnimeData[];
    };
  };
}

// GraphQL queries
const trendingQuery = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(sort: TRENDING_DESC, type: ANIME) {
      id
      status
    }
  }
}
`;

const popularQuery = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(sort: POPULARITY_DESC, type: ANIME) {
      id
      status
    }
  }
}
`;

// Utility function to get a random proxy
function getRandomProxy(): string {
  const randomIndex = Math.floor(Math.random() * proxies.length);
  return proxies[randomIndex];
}

// Fetch function that uses a random proxy
async function fetchFromAniList<T>(query: string, variables: any): Promise<T> {
  try {
    // Use a random proxy from the list
    const proxyUrl = getRandomProxy();
    const response = await ky.post(`${proxyUrl}/${ANILIST_API}`, {
      json: { query, variables },
      headers: {
        Origin: "https://ayoko.fun",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching data from AniList:", error);
    throw error;
  }
}

// Function to get trending anime
export async function getTrendingAnime(
  page: number = 1,
  perPage: number = 50
): Promise<number[]> {
  const response = await fetchFromAniList<TrendingAnimeResponse>(
    trendingQuery,
    {
      page,
      perPage,
    }
  );
  return response.data.Page.media
    .filter((anime) => anime.status !== "NOT_YET_RELEASED")
    .map((anime) => anime.id);
}

// Function to get popular anime
export async function getPopularAnime(
  page: number = 1,
  perPage: number = 50
): Promise<number[]> {
  const response = await fetchFromAniList<PopularAnimeResponse>(popularQuery, {
    page,
    perPage,
  });
  return response.data.Page.media
    .filter((anime) => anime.status !== "NOT_YET_RELEASED")
    .map((anime) => anime.id);
}
