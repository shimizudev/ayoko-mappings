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
  episodes: Episode[],
  info1: MediaData,
  info2: AnimeData,
  info3: ParsedData & { artworks: Artworks },
  info4: IAnimeInfo[],
  info5: Anime
): AnimeInfo => {
  info4 = info4.filter(Boolean);

  const mergedGenres = Array.from(
    new Set([
      ...(info1 && info1.genres ? info1.genres.filter(Boolean) : []),
      ...info5.genres.filter(Boolean),
      ...info4.flatMap((info) => info.genres!.filter(Boolean)),
    ])
  );

  const mergedTitles = {
    romaji: (info2 && info2.attributes.titles.en_jp) || info1.title.romaji,
    english: (info2 && info2.attributes.titles.en) || info1.title.english,
    native: (info2 && info2.attributes.titles.ja_jp) || info1.title.native,
    userPreferred:
      (info2 && info2.attributes.canonicalTitle) || info1.title.userPreferred,
  };

  const mergedCoverImage =
    (info3 && info3.artworks.posters[0]) ||
    info1.coverImage ||
    (info2 && info2.attributes.posterImage.original);

  const mergedBannerImage =
    (info3 && info3.artworks.banners[0]) ||
    info1.bannerImage ||
    (info2 && info2.attributes.coverImage?.original);

  function mergeEpisodesWithMetadata(
    episodeData: Episode[],
    providerEpisodes: { providerId: string; sub: any[]; dub: any[] }[]
  ) {
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

  const filterSub = info4.find(
    (f) => !(f.title as string).toString().includes("(Dub)")
  );
  const filterDub = info4.find((f) =>
    (f.title as string).toString().includes("(Dub)")
  );

  const formattedEpisodes = mergeEpisodesWithMetadata(episodes, [
    {
      providerId: "gogoanime",
      sub: filterSub?.episodes!,
      dub: filterDub?.episodes?.length! > 0 ? filterDub?.episodes! : [],
    },
    {
      providerId: "hianime",
      sub: info5.episodes,
      dub: filterDub?.episodes?.length! > 0 ? info5?.episodes : [],
    },
  ]);

  const mergedInfo: AnimeInfo = {
    ...info1,
    clearArt: (info3 && info3.artworks.clearArt[0]) || null,
    clearLogo: (info3 && info3.artworks.clearLogo[0]) || null,
    streamEpisodes: formattedEpisodes!,
    artworks: info3 && info3.artworks,
    title: mergedTitles,
    genres: mergedGenres,
    bannerImage: mergedBannerImage!,
    coverImage: mergedCoverImage,
    createdAt: info2 && info2.attributes.createdAt,
    slug: (info2 && info2.attributes.slug) || null,
    synopsis: (info2 && info2.attributes.synopsis) || null,
    description: (info2 && info2.attributes.description) || null,
    coverImageTopOffset:
      (info2 && info2.attributes.coverImageTopOffset) || null,
    averageRating: (info2 && info2.attributes.averageRating) || null,
    userCount: info2 && info2.attributes.userCount,
    favoritesCount: info2 && info2.attributes.favoritesCount,
    nextRelease: (info2 && info2.attributes.nextRelease) || null,
    popularityRank: info2 && info2.attributes.popularityRank,
    ratingRank: (info2 && info2.attributes.ratingRank) || null,
    ageRating: (info2 && info2.attributes.ageRating) || null,
    ageRatingGuide: (info2 && info2.attributes.ageRatingGuide) || null,
    subtype: (info2 && info2.attributes.subtype) || null,
    posterImages: {
      tiny: (info2 && info2.attributes.posterImage.tiny) || null,
      small: (info2 && info2.attributes.posterImage.small) || null,
      medium: (info2 && info2.attributes.posterImage.medium) || null,
      large: (info2 && info2.attributes.posterImage.large) || null,
      original: (info2 && info2.attributes.posterImage.original) || null,
    },
    coverImages: {
      tiny: (info2 && info2.attributes.coverImage?.tiny) || null,
      small: (info2 && info2.attributes.coverImage?.small) || null,
      large: (info2 && info2.attributes.coverImage?.large) || null,
      original: (info2 && info2.attributes.coverImage?.original) || null,
    },
    episodeCount: (info2 && info2.attributes.episodeCount) || null,
    episodeLength: (info2 && info2.attributes.episodeLength) || null,
    totalLength: (info2 && info2.attributes.totalLength) || null,
    youtubeVideoId: (info2 && info2.attributes.youtubeVideoId) || null,
    showType: (info2 && info2.attributes.showType) || null,
    nsfw: info2 && info2.attributes.nsfw,
  };

  return mergedInfo;
};
