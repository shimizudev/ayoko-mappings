export interface Title {
  english: string | null;
  romaji: string | null;
  native: string | null;
  userPreferred: string;
}

export type Result<T extends object = {}> = {
  id: string;
  title: string | Title;
  poster: string;
  url: string;
} & T;
