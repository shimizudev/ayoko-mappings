import ky, { type KyResponse } from "ky";
import { type Result } from "../../types/anime";

export default abstract class BaseProvider {
  abstract url: string;
  abstract name: string;

  public search(query: string): Promise<Result[] | undefined> {
    return new Promise((r) => r(undefined));
  }

  async request(
    url: URL | string,
    requestInit: RequestInit = {},
    retries = 0
  ): Promise<KyResponse<unknown>> {
    const instance = ky.create({ prefixUrl: this.url });

    const response = await instance(url, requestInit);

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 3000; // default to 3 seconds if no retry-after header
        console.log(
          `Rate limit hit. Retrying after ${delay / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.request(
          url,
          requestInit,
          retries + 1
        ) as Promise<KyResponse<unknown>>;
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    const remainingRequests = response.headers.get("x-ratelimit-remaining");
    const resetTime = response.headers.get("x-ratelimit-reset");

    if (remainingRequests && parseInt(remainingRequests) <= 60 && resetTime) {
      const delay = parseInt(resetTime) * 1000 - Date.now();
      console.log(
        `Approaching rate limit. Waiting for ${delay / 1000} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.request(url, requestInit, retries) as Promise<KyResponse<unknown>>;
    }

    return response;
  }
}
