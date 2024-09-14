import { load } from "cheerio";
import type { Result } from "../../types/anime";
import BaseProvider from "./base";

export class Hianime extends BaseProvider {
  override url: string = "https://hianime.to";
  override name: string = "Hianime";


  constructor(url?: string) {
    super();
    this.url = url ? url : this.url;
  }

  override async search(
    query: string
  ): Promise<(Result & { episodes?: number; duration: string })[] | undefined> {
    const res = await this.request(
      `search?keyword=${encodeURIComponent(query)}`
    );
    const body = await res.text();

    const $ = load(body);

    const result: (Result & { episodes?: number; duration: string })[] = [];

    $(".film_list-wrap .flw-item").each((_, el) => {
      const $el = $(el);

      const title = $el.find(".film-name").text().trim() ?? "";
      const poster = $el.find(".film-poster img").attr("data-src") ?? "";
      const url = $el.find(".film-name a").attr("href") ?? "";
      const id = url?.split("/").pop()?.split("?ref=").shift() ?? "";
      const episodes = Number(
        $el.find(".film-poster .tick-item.tick-sub").text().trim()
      );
      const duration = $el.find(".fdi-item.fdi-duration").text().trim();

      result.push({
        id,
        title,
        poster,
        url: `${this.url}${url}`,
        episodes: episodes,
        duration: duration,
      });
    });

    return result;
  }
}
