import type { Episode } from "../episode/cover";
import type { IAnimeInfo } from "@consumet/extensions";
import type { ParsedData, Artworks } from "../mappings/tvdb";
import type { AnimeData } from "../providers/meta/kitsu";
import type { MediaData } from "../providers/meta/anilist";
import type { Anime } from "../mappings/hianime";

type AnimeInfo = MediaData & {
  clearArt: string | null;
  clearLogo: string | null;
  streamEpisodes: {
    providerId: string;
    episodes: { sub: any[]; dub: any[] };
  }[];
  artworks: Artworks;
  createdAt: string | null;
  updatedAt: number | null;
  slug: string | null;
  synopsis: string | null;
  description: string | null;
  coverImageTopOffset: number | null;
  averageRating: string | null;
  userCount: number;
  favoritesCount: number;
  nextRelease: string | null;
  popularityRank: number | null;
  ratingRank: number | null;
  ageRating: string | null;
  ageRatingGuide: string | null;
  subtype: string | null;
  status: string | null;
  posterImages: {
    tiny: string | null;
    small: string | null;
    medium: string | null;
    large: string | null;
    original: string | null;
  };
  coverImages: {
    tiny: string | null;
    small: string | null;
    large: string | null;
    original: string | null;
  };
  episodeCount: number | null;
  episodeLength: number | null;
  totalLength: number | null;
  youtubeVideoId: string | null;
  showType: string | null;
  nsfw: boolean;
};

export const mergeInfo = (
  episodes: Episode[] | null,
  info1: MediaData | null,
  info2: AnimeData | null,
  info3: (ParsedData & { artworks: Artworks }) | null,
  info4: IAnimeInfo[] | null,
  info5: Anime | null
): AnimeInfo => {
  // Ensure info4 is an array and filter out null/undefined values
  info4 = (info4 ?? []).filter(Boolean);

  // Safely merge genres using optional chaining and fallback to an empty array
  const mergedGenres = Array.from(
    new Set([
      ...(info1?.genres?.filter(Boolean) || []),
      ...(info5?.genres?.filter(Boolean) || []),
      ...info4.flatMap((info) => info.genres?.filter(Boolean) || []),
    ])
  );

  const mergedTitles = {
    romaji: info1?.title.romaji || info2?.attributes.titles.en_jp || null,
    english: info1?.title.english || info2?.attributes.titles.en || null,
    native: info1?.title.native || info2?.attributes.titles.ja_jp || null,
    userPreferred:
      info1?.title.userPreferred || info2?.attributes.canonicalTitle || null,
  };

  // Safely access artwork/poster images with fallback
  const mergedCoverImage =
    info3?.artworks.posters[0] ||
    info1?.coverImage ||
    info2?.attributes.posterImage.original ||
    null;

  const mergedBannerImage =
    info3?.artworks.banners[0] ||
    info1?.bannerImage ||
    info2?.attributes.coverImage?.original ||
    null;

  // Merging episodes with metadata (ensuring all optional fields are safely accessed)
  function mergeEpisodesWithMetadata(
    episodeData: Episode[] | null,
    providerEpisodes: { providerId: string; sub: any[]; dub: any[] }[]
  ) {
    if (!episodeData) return null;

    function mapEpisodes(episodes: any[], metadata: Episode[]) {
      return episodes.map((episode, index) => {
        const meta = metadata.find(
          (metaItem) => metaItem.episodeNumber === index + 1
        );
        return {
          ...meta,
          id: episode.id || episode.episodeId,
          isFiller: episode.isFiller || false,
        };
      });
    }

    const mergedEpisodes = providerEpisodes.map((providerData) => ({
      providerId: providerData.providerId,
      episodes: {
        sub: mapEpisodes(providerData.sub, episodeData),
        dub: mapEpisodes(providerData.dub, episodeData),
      },
    }));

    return mergedEpisodes.length > 0 ? mergedEpisodes : null;
  }

  const filterSub = info4?.find(
    (f) => !(f.title as string).toString().includes("(Dub)")
  );
  const filterDub = info4?.find((f) =>
    (f.title as string).toString().includes("(Dub)")
  );

  const formattedEpisodes = mergeEpisodesWithMetadata(episodes, [
    {
      providerId: "gogoanime",
      sub: filterSub?.episodes || [],
      dub: filterDub?.episodes?.length ? filterDub.episodes : [],
    },
    {
      providerId: "hianime",
      sub: info5?.episodes || [],
      dub: filterDub?.episodes?.length ? info5?.episodes || [] : [],
    },
  ]);

  const mergedInfo: AnimeInfo = {
    id: String(info1?.id),
    idMal: info1?.idMal || null,
    color: info1?.color || null,
    description: info1?.description || null,
    averageScore: info1?.averageScore || null,
    episodes: info1?.episodes || null,
    duration: info1?.duration || null,
    startDate: info1?.startDate || null,
    endDate: info1?.endDate || null,
    countryOfOrigin: info1?.countryOfOrigin || null,
    format: info1?.format || null,
    hashtag: info1?.hashtag || null,
    season: info1?.season || null,
    status: info1?.status || null,
    synonyms: info1?.synonyms || [],
    studios: info1?.studios || [],
    tags: info1?.tags || [],
    nextAiringEpisode: info1?.nextAiringEpisode
      ? {
          airingAt: info1?.nextAiringEpisode.airingAt,
          episode: info1?.nextAiringEpisode.episode,
          timeUntilAiring: info1?.nextAiringEpisode.timeUntilAiring,
        }
      : null,
    characters: info1?.characters || [],
    relations: info1?.relations || [],
    popularity: info1?.popularity || 0,
    trending: info1?.trending || 0,
    updatedAt: info1?.updatedAt || null,
    clearArt: info3?.artworks.clearArt[0] || null,
    clearLogo: info3?.artworks.clearLogo[0] || null,
    streamEpisodes: formattedEpisodes || [],
    artworks:
      info3?.artworks ||
      ({
        banners: [],
        backgrounds: [],
        clearLogo: [],
        clearArt: [],
        icons: [],
        posters: [],
      } as Artworks),
    title: mergedTitles,
    genres: mergedGenres,
    bannerImage: mergedBannerImage,
    coverImage: mergedCoverImage,
    createdAt: info2?.attributes.createdAt || null,
    slug: info2?.attributes.slug || null,
    synopsis: info2?.attributes.synopsis || null,
    coverImageTopOffset: info2?.attributes.coverImageTopOffset || null,
    averageRating: info2?.attributes.averageRating || null,
    userCount: info2?.attributes.userCount || 0,
    favoritesCount: info2?.attributes.favoritesCount || 0,
    nextRelease: info2?.attributes.nextRelease || null,
    popularityRank: info2?.attributes.popularityRank || null,
    ratingRank: info2?.attributes.ratingRank || null,
    ageRating: info2?.attributes.ageRating || null,
    ageRatingGuide: info2?.attributes.ageRatingGuide || null,
    subtype: info2?.attributes.subtype || null,
    posterImages: {
      tiny: info2?.attributes.posterImage.tiny || null,
      small: info2?.attributes.posterImage.small || null,
      medium: info2?.attributes.posterImage.medium || null,
      large: info2?.attributes.posterImage.large || null,
      original: info2?.attributes.posterImage.original || null,
    },
    coverImages: {
      tiny: info2?.attributes.coverImage?.tiny || null,
      small: info2?.attributes.coverImage?.small || null,
      large: info2?.attributes.coverImage?.large || null,
      original: info2?.attributes.coverImage?.original || null,
    },
    episodeCount: info2?.attributes.episodeCount || null,
    episodeLength: info2?.attributes.episodeLength || null,
    totalLength: info2?.attributes.totalLength || null,
    youtubeVideoId: info2?.attributes.youtubeVideoId || null,
    showType: info2?.attributes.showType || null,
    nsfw: info2?.attributes.nsfw || false,
  };

  return mergedInfo;
};
