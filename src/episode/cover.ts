import ky, { HTTPError } from "ky";

interface Titles {
  "x-jat": string;
  ja: string;
  en: string;
  it?: string;
  he?: string;
  de?: string;
  fr?: string;
  es?: string;
  ru?: string;
  ko?: string;
  ar?: string;
  "zh-Hans"?: string;
}

interface EpisodeTitle {
  ja: string;
  en: string;
  fr?: string;
  "x-jat"?: string;
}

export interface Episode {
  tvdbShowId: number;
  tvdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  absoluteEpisodeNumber: number;
  title: EpisodeTitle;
  airDate: string;
  airDateUtc: string;
  runtime: number;
  overview: string;
  image: string;
  episode: string;
  anidbEid: number;
  length: number;
  airdate: string;
  rating: string;
  summary: string;
}

interface Episodes {
  [episodeNumber: string]: Episode;
}

interface AnimeSeason {
  titles: Titles;
  episodes: Episodes;
}

export const getAnimeEpisodeMetadata = async (id: string) => {
  try {
    const res = await ky.get(`https://api.ani.zip/mappings?anilist_id=${id}`);
    const data = await res.json<AnimeSeason>();

    const episodes = data.episodes;
    let modifiedEpisodes: Episode[] = [];

    for (const episode in episodes) {
      modifiedEpisodes.push(episodes[episode]);
    }

    return modifiedEpisodes;
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 404) {
      console.log("Anizip not found for", id);
      return [];
    } else {
      return [];
    }
  }
};
