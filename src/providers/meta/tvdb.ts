import ky from "ky";

export enum Format {
  TV = "TV",
  MOVIE = "MOVIE",
  ONA = "ONA",
  SPECIAL = "SPECIAL",
  TV_SHORT = "TV_SHORT",
  OVA = "OVA",
  UNKNOWN = "UNKNOWN",
}

interface Result {
  id: string;
  format: Format;
  title: string;
  altTitles?: string[];
  img?: string;
  year: number;
  providerId: string;
}

export class TheTVDB {
  rateLimit = 500;
  id = "tvdb";
  url = "https://thetvdb.com";
  formats: Format[] = [
    Format.TV,
    Format.MOVIE,
    Format.ONA,
    Format.SPECIAL,
    Format.TV_SHORT,
    Format.OVA,
  ];
  private tvdbApiUrl = "https://api4.thetvdb.com/v4";
  private apiKeys = [
    "f5744a13-9203-4d02-b951-fbd7352c1657",
    "8f406bec-6ddb-45e7-8f4b-e1861e10f1bb",
    "5476e702-85aa-45fd-a8da-e74df3840baf",
    "51020266-18f7-4382-81fc-75a4014fa59f",
  ];

  async search(
    query: string,
    format?: Format,
    year?: number
  ): Promise<Result[] | undefined> {
    const results: Result[] = [];
    const isSeason = query.toLowerCase().includes("season");

    if (isSeason) {
      query = query.toLowerCase().replace("season", "");
    }

    const token = await this.getToken(
      this.apiKeys[Math.floor(Math.random() * this.apiKeys.length)]
    );

    if (!token) return undefined;

    const formattedType =
      format === Format.TV ||
      format === Format.TV_SHORT ||
      format === Format.SPECIAL
        ? "series"
        : format === Format.MOVIE
        ? "movie"
        : undefined;

    const data = await (
      await ky.get(`${this.tvdbApiUrl}/search`, {
        searchParams: {
          query: encodeURIComponent(query),
          ...(year && !isSeason && { year: year.toString() }),
          ...(formattedType && { type: formattedType }),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    )
      .json<{ data: Search[] }>()
      .catch(() => undefined);

    if (data) {
      for (const item of data.data) {
        if (
          item.primary_type !== TVDBType.SERIES &&
          item.primary_type !== TVDBType.MOVIE
        )
          continue;
        if (isSeason) item.year = "0";

        results.push({
          id: `${item.tvdb_id}`,
          format: Format.UNKNOWN,
          title: item.name,
          altTitles: item.aliases ?? [],
          img: item.image_url,
          year: Number(item.year ?? 0) || 0,
          providerId: this.id,
        });
      }
    }

    return results;
  }

  private async getToken(key: string): Promise<string | undefined> {
    const response = await (
      await ky.post(`${this.tvdbApiUrl}/login`, {
        json: { apikey: key },
        headers: {
          "Content-Type": "application/json",
        },
      })
    )
      .json<{ data: { token: string } }>()
      .catch((err) => {
        console.error(err);
        return undefined;
      });

    return response?.data.token;
  }
}

/* Search Types */
interface Search {
  objectID: string;
  country?: Country;
  director?: string;
  extended_title?: string;
  genres?: Genre[];
  id: string;
  image_url: string;
  name: string;
  overview?: string;
  primary_language?: PrimaryLanguage;
  primary_type: TVDBType;
  status?: Status;
  type: TVDBType;
  tvdb_id: string;
  year?: string;
  slug?: string;
  overviews?: Overviews;
  translations: Overviews;
  remote_ids?: RemoteID[];
  thumbnail?: string;
  aliases?: string[];
  first_air_time?: Date;
  network?: string;
  studios?: string[];
}

enum Country {
  CZE = "cze",
  JPN = "jpn",
  USA = "usa",
}

enum Genre {
  ACTION = "Action",
  ADVENTURE = "Adventure",
  ANIMATION = "Animation",
  ANIME = "Anime",
  CHILDREN = "Children",
  COMEDY = "Comedy",
  DRAMA = "Drama",
  FAMILY = "Family",
  FANTASY = "Fantasy",
  SPORT = "Sport",
}

interface Overviews {
  eng?: string;
  fra?: string;
  ita?: string;
  jpn?: string;
  pol?: string;
  pt?: string;
  spa?: string;
  por?: string;
  ara?: string;
  cat?: string;
  deu?: string;
  heb?: string;
  kor?: string;
  msa?: string;
  rus?: string;
  srp?: string;
  tur?: string;
  zho?: string;
  hun?: string;
  cha?: string;
  nld?: string;
  tha?: string;
  ces?: string;
}

enum PrimaryLanguage {
  CES = "ces",
  ENG = "eng",
  ITA = "ita",
  JPN = "jpn",
}

enum TVDBType {
  LIST = "list",
  MOVIE = "movie",
  SERIES = "series",
}

interface RemoteID {
  id: string;
  type: number;
  sourceName: SourceName;
}

enum SourceName {
  EIDR = "EIDR",
  FACEBOOK = "Facebook",
  FANSITE = "Fan Site",
  IMDB = "IMDB",
  INSTAGRAM = "Instagram",
  OFFICIAL_WEBSITE = "Official Website",
  TMS_ZAP2It = "TMS (Zap2It)",
  TMDB = "TheMovieDB.com",
  TWITTER = "Twitter",
  YOUTUBE = "Youtube",
}

enum Status {
  CONTINUING = "Continuing",
  ENDED = "Ended",
  RELEASED = "Released",
  UPCOMING = "Upcoming",
}
