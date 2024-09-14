import mongoose, { Schema, Document } from "mongoose";

interface Title {
  romaji: string | null;
  english: string | null;
  native: string | null;
  userPreferred: string | null;
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

interface Character {
  id: number;
  role: string;
  name: string;
  image: string | null;
}

interface Relation {
  relationType: string;
  id: number;
  title: Title;
}

interface Episode {
  tvdbShowId: number | null;
  tvdbId: number | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  absoluteEpisodeNumber: number | null;
  title: {
    ja: string | null;
    en: string | null;
    "x-jat": string | null;
  };
  airDate: string | null;
  airDateUtc: string | null;
  runtime: number | null;
  overview: string | null;
  image: string | null;
  episode: string | null;
  anidbEid: number | null;
  length: number | null;
  airdate: string | null;
  rating: string | null;
  id: string | null;
  url: string | null;
}

interface Artworks {
  backgrounds: string[];
  banners: string[];
  clearArt: string[];
  clearLogo: string[];
  icons: string[];
  posters: string[];
}

interface MatchData {
  id: string | null;
  score: number;
  type: string;
}

interface GogoData {
  sub: MatchData;
  dub: MatchData;
}

interface AnimeResults {
  gogo: GogoData;
  hianime: MatchData;
  tvdb: MatchData;
  kitsu: MatchData;
  yugen: MatchData;
}

export interface AnimeInfo extends Document {
  id: number;
  idMal: number | null;
  title: Title;
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
  format: string | null;
  genres: string[];
  hashtag: string | null;
  season: string | null;
  status: string | null;
  synonyms: string[];
  mappings: AnimeResults;
  studios: Studio[];
  tags: Tag[];
  nextAiringEpisode: NextAiringEpisode | null;
  characters: Character[];
  relations: Relation[];
  popularity: number | null;
  trending: number | null;
  updatedAt: number | null;
  clearArt: string | null;
  clearLogo: string | null;
  streamEpisodes: {
    episodes: Episode;
    providerId: string;
  }[];
  artworks: Artworks;
  createdAt: string | null;
  slug: string | null;
  synopsis: string | null;
  coverImageTopOffset: number | null;
  averageRating: string | null;
  userCount: number | null;
  favoritesCount: number | null;
  nextRelease: string | null;
  popularityRank: number | null;
  ratingRank: number | null;
  ageRating: string | null;
  ageRatingGuide: string | null;
  subtype: string | null;
  showType: string | null;
  episodeCount: number | null;
  episodeLength: number | null;
  totalLength: number | null;
  youtubeVideoId: string | null;
  nsfw: boolean;
}

const AnimeInfoSchema: Schema = new Schema({
  id: { type: Number, default: null, unique: true, sparse: true },
  idMal: { type: Number, default: null, unique: true, sparse: true },
  slug: { type: String, default: null },
  title: {
    romaji: { type: String, default: "", index: true },
    english: { type: String, default: "", index: true },
    native: { type: String, default: "", index: true },
    userPreferred: { type: String, default: "", index: true },
  },
  bannerImage: { type: String, default: null },
  coverImage: { type: String, default: null },
  color: { type: String, default: null },
  description: { type: String, default: null },
  averageScore: { type: Number, default: 0 },
  episodes: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  startDate: {
    year: { type: Number, default: null },
    month: { type: Number, default: null },
    day: { type: Number, default: null },
  },
  endDate: {
    year: { type: Number, default: null },
    month: { type: Number, default: null },
    day: { type: Number, default: null },
  },
  countryOfOrigin: { type: String, default: "", index: true },
  format: { type: String, default: "", index: true },
  genres: { type: [String], default: [], index: true },
  hashtag: { type: String, default: null },
  season: { type: String, default: "", index: true },
  status: { type: String, default: "", index: true },
  synonyms: { type: [String], default: [] },
  mappings: {
    gogo: {
      sub: {
        id: { type: String, default: null },
        score: { type: Number, default: 0 },
        type: { type: String, default: "fuzzy" },
      },
      dub: {
        id: { type: String, default: null },
        score: { type: Number, default: 0 },
        type: { type: String, default: "fuzzy" },
      },
    },
    hianime: {
      id: { type: String, default: null },
      score: { type: Number, default: 0 },
      type: { type: String, default: "fuzzy" },
    },
    tvdb: {
      id: { type: String, default: null },
      score: { type: Number, default: 0 },
      type: { type: String, default: "fuzzy" },
    },
    kitsu: {
      id: { type: String, default: null },
      score: { type: Number, default: 0 },
      type: { type: String, default: "fuzzy" },
    },
    yugen: {
      id: { type: String, default: null },
      score: { type: Number, default: 0 },
      type: { type: String, default: "fuzzy" },
    },
  },
  studios: [
    {
      id: { type: Number },
      name: { type: String },
      isMain: { type: Boolean },
    },
  ],
  tags: [
    {
      id: { type: Number, index: true },
      name: { type: String, index: true },
      category: { type: String, default: null, index: true },
    },
  ],
  nextAiringEpisode: {
    airingAt: { type: Number, default: null },
    episode: { type: Number, default: null },
    timeUntilAiring: { type: Number, default: null },
  },
  characters: [
    {
      id: { type: Number },
      role: { type: String },
      name: { type: String },
      image: { type: String, default: null },
    },
  ],
  relations: [
    {
      relationType: { type: String },
      id: { type: Number },
      title: {
        romaji: { type: String, default: null },
        english: { type: String, default: null },
        native: { type: String, default: null },
      },
    },
  ],
  popularity: { type: Number, default: null },
  trending: { type: Number, default: null },
  updatedAt: { type: Number, default: null },
  clearArt: { type: String, default: null },
  clearLogo: { type: String, default: null },
  streamEpisodes: [
    {
      episodes: {
        tvdbShowId: { type: Number, default: null },
        tvdbId: { type: Number, default: null },
        seasonNumber: { type: Number, default: null },
        episodeNumber: { type: Number, default: null },
        absoluteEpisodeNumber: { type: Number, default: null },
        title: {
          ja: { type: String, default: null },
          en: { type: String, default: null },
          "x-jat": { type: String, default: null },
        },
        airDate: { type: String, default: null },
        airDateUtc: { type: String, default: null },
        runtime: { type: Number, default: null },
        overview: { type: String, default: null },
        image: { type: String, default: null },
        episode: { type: String, default: null },
        anidbEid: { type: Number, default: null },
        length: { type: Number, default: null },
        airdate: { type: String, default: null },
        rating: { type: String, default: null },
        id: { type: String, default: null },
        url: { type: String, default: null },
      },
      providerId: { type: String, default: null },
    },
  ],
  artworks: {
    backgrounds: { type: [String], default: [] },
    banners: { type: [String], default: [] },
    clearArt: { type: [String], default: [] },
    clearLogo: { type: [String], default: [] },
    icons: { type: [String], default: [] },
    posters: { type: [String], default: [] },
  },
  createdAt: { type: String, default: null },
  synopsis: { type: String, default: null },
  averageRating: { type: String, default: "", index: true },
  userCount: { type: Number, default: 0, index: true },
  favoritesCount: { type: Number, default: 0, index: true },
  nextRelease: { type: String, default: "", index: true },
  popularityRank: { type: Number, default: 0, index: true },
  ratingRank: { type: Number, default: 0, index: true },
  ageRating: { type: String, default: "", index: true },
  ageRatingGuide: { type: String, default: "", index: true },
  subtype: { type: String, default: "", index: true },
  showType: { type: String, default: "", index: true },
  episodeCount: { type: Number, default: 0, index: true },
  episodeLength: { type: Number, default: 0, index: true },
  totalLength: { type: Number, default: 0, index: true },
  youtubeVideoId: { type: String, default: "", index: true },
  numberOfReviews: { type: Number, default: 0, index: true },
  averageEpisodeScore: { type: Number, default: 0, index: true },
  airingStatus: { type: String, default: "", index: true },
  streamingStatus: { type: String, default: "", index: true },
  tvdbId: { type: String, default: "", index: true },
});

AnimeInfoSchema.index({ id: 1 }, { unique: true, sparse: true });
AnimeInfoSchema.index({ slug: 1 }, { unique: true, sparse: true });
AnimeInfoSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $ne: null } } }
);

const Anime = mongoose.model<AnimeInfo>("AnimeInfo", AnimeInfoSchema);

export default Anime;
