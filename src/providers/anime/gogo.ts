import { load } from "cheerio";
import type { Result } from "../../types/anime";
import BaseProvider from "./base";

export class Gogoanime extends BaseProvider {
  override url: string = "https://anitaku.pe";
  override name: string = "Gogoanime";

  constructor(url?: string) {
    super();
    this.url = url ? url : this.url;
  }

  override async search(query: string): Promise<Result[] | undefined> {
    const res = await this.request(
      `search.html?keyword=${encodeURIComponent(query)}`
    );
    const body = await res.text();

    const $ = load(body);

    const result: Result[] = [];

    $("ul.items > li").each((_, el) => {
      const $el = $(el);

      const title = $el.find(".name").text().trim() ?? "";
      const poster = $el.find(".img img").attr("src") ?? "";
      const url = $el.find(".name a").attr("href") ?? "";
      const id = url?.split("/").pop() ?? "";

      result.push({
        id,
        title,
        poster,
        url: `${this.url}${url}`,
      });
    });

    return result;
  }
}
