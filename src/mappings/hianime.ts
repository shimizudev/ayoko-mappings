import { Anilist } from "../providers/meta/anilist";
import { Hianime } from "../providers/anime/hianime";
import { findBestMatchedAnime } from "../title/similarity";
import type { Result, Title } from "../types/anime";
import { sanitizeTitle } from "../title/sanitizer";

export interface Anime {
  id: string;
  anilistId: number;
  malId: number;
  name: string;
  poster: string;
  description: string;
  stats: Stats;
  promotionalVideos: PromotionalVideo[];
  charactersVoiceActors: CharacterVoiceActor[];
  japanese: string;
  aired: string;
  premiered: string;
  duration: string;
  status: string;
  malscore: string;
  genres: string[];
  studios: string;
  producers: string[];
  episodes: Episode[];
}

interface Stats {
  rating: string;
  quality: string;
  episodes: EpisodesCount;
  type: string;
  duration: string;
}

interface EpisodesCount {
  sub: number;
  dub: number;
}

interface PromotionalVideo {
  title: string;
  source: string;
  thumbnail: string;
}

interface CharacterVoiceActor {
  character: Character;
  voiceActor: VoiceActor;
}

interface Character {
  id: string;
  poster: string;
  name: string;
  cast: string;
}

interface VoiceActor {
  id: string;
  poster: string;
  name: string;
  cast: string;
}

interface Episode {
  title: string;
  episodeId: string;
  number: number;
  isFiller: boolean;
}

export const getHianime = async (id: string) => {
  try {
    const hi = new Hianime();
    const ani = new Anilist();

    const info = await ani.get(id);

    // Ugh I hate hianime for this...
    const title = {
      english:
        info?.title.english &&
        info?.title.english.toLowerCase().replaceAll("oshi no ko", "My Star"),
      romaji:
        info?.title.romaji &&
        info?.title.romaji.toLowerCase().replaceAll("oshi no ko", "My Star"),
      native:
        info?.title.native &&
        info?.title.native.toLowerCase().replaceAll("oshi no ko", "My Star"),
      userPreferred:
        info?.title.userPreferred &&
        info?.title.userPreferred
          .toLowerCase()
          .replaceAll("oshi no ko", "My Star"),
    };

    const response = await hi.search(sanitizeTitle(title.userPreferred!));

    const best = findBestMatchedAnime(
      title as Title,
      response as unknown as Result[]
    );

    const infoPromise = best?.bestMatch ? hi.getInfo(best?.bestMatch.id) : null;

    const episodesPromise = best?.bestMatch
      ? hi.getAnimeEpisodes(best?.bestMatch.id)
      : null;

    const [bestInfo, bestEpisodes] = await Promise.all([
      infoPromise,
      episodesPromise,
    ]);

    return {
      match: {
        ...bestInfo?.anime.info,
        ...bestInfo?.anime.moreInfo,
        episodes: bestEpisodes?.episodes,
      } as Anime,
      score: best?.similarity,
      index: best?.index,
      matchType: best?.matchType as "strict" | "fuzzy",
    };
  } catch (error) {
    console.log(error);

    return {
      match: {
        id: "",
        anilistId: 0,
        malId: 0,
        name: "",
        poster: "",
        description: "",
        stats: {
          rating: "",
          quality: "",
          episodes: {
            sub: 0,
            dub: 0,
          },
          type: "",
          duration: "",
        },
        promotionalVideos: [],
        charactersVoiceActors: [],
        japanese: "",
        aired: "",
        premiered: "",
        duration: "",
        status: "",
        malscore: "",
        genres: [],
        studios: "",
        producers: [],
        episodes: [],
      } as Anime,
      score: 0,
      index: -1,
      matchType: "fuzzy" as "strict" | "fuzzy",
    };
  }
};
