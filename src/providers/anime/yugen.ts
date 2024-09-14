import { load } from "cheerio";
import type { Result } from "../../types/anime";
import BaseProvider from "./base";

export class Yugenanime extends BaseProvider {
  override url: string = "https://yugenanime.tv";
  override name: string = "Yugenanime";

  constructor(url?: string) {
    super();
    this.url = url ? url : this.url;
  }

  override async search(
    query: string
  ): Promise<(Result & { slug?: string; type?: string })[] | undefined> {
    const res = await this.request(`discover/?q=${encodeURIComponent(query)}`);
    const body = await res.text();

    const $ = load(body);

    const result: (Result & { slug?: string; type?: string })[] = [];

    $(".cards-grid > a").each((_, el) => {
      const $el = $(el);

      const title = $el.find(".anime-name").text().trim() ?? "";
      const poster =
        $el.find(".anime-poster__container img").attr("data-src") ?? "";
      const url = $el.attr("href");
      const splittedUrl = url?.split("/");
      const type = splittedUrl?.[1] ?? "";
      const id = splittedUrl?.[2] ?? "";
      const slug = splittedUrl?.[3] ?? "";

      result.push({
        id,
        slug,
        title,
        type: type.toUpperCase(),
        poster,
        url: `${this.url}${url}`,
      });
    });

    return result;
  }
}
