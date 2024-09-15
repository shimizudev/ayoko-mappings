import { mergeInfo } from "./generateInfo";
import { getGogo } from "../mappings/gogo";
import { getHianime } from "../mappings/hianime";
import { getTVDB } from "../mappings/tvdb";
import { getKitsu } from "../mappings/kitsu";
import { Anilist } from "../providers/meta/anilist";
import { getYugen } from "../mappings/yugen";
import { getAnimeEpisodeMetadata } from "../episode/cover";

export const getAnimeInfo = async (id: string) => {
  const anilist = new Anilist();
  const anilistI = anilist.get(id);
  const episodes = getAnimeEpisodeMetadata(id);
  const gogo = getGogo(id);
  const hianime = getHianime(id);
  const tvdb = getTVDB(id);
  const kitsu = getKitsu(id);
  const yugen = getYugen(id);

  const results = await Promise.all([
    anilistI,
    gogo,
    hianime,
    tvdb,
    episodes,
    kitsu,
    yugen,
  ]);

  const [
    info,
    gogoResult,
    hianimeResult,
    tvdbResult,
    animeEpisodes,
    kitsuResult,
    yugenResult,
  ] = results;

  const mergedInfo = mergeInfo(
    animeEpisodes,
    info!,
    kitsuResult.match!,
    tvdbResult.match!,
    [gogoResult.sub.match!, gogoResult.dub.match!]!,
    hianimeResult.match!
  );

  const mappings = {
    gogo: {
      sub: {
        id: gogoResult.sub.match?.id,
        score: gogoResult.sub.score,
        type: gogoResult.sub.matchType,
      },
      dub: {
        id: gogoResult.dub.match?.id || null,
        score: gogoResult.dub.score,
        type: gogoResult.dub.matchType,
      },
    },
    hianime: {
      id: hianimeResult.match?.id,
      score: hianimeResult.score,
      type: hianimeResult.matchType,
    },
    tvdb: {
      id:
        mergedInfo &&
        mergedInfo.streamEpisodes &&
        mergedInfo.streamEpisodes[0].episodes &&
        mergedInfo.streamEpisodes[0].episodes.sub[0] &&
        mergedInfo.streamEpisodes[0].episodes.sub[0].tvdbShowId
          ? mergedInfo.streamEpisodes[0].episodes.sub[0].tvdbShowId
          : null,
      score: tvdbResult.score,
      type: tvdbResult.matchType,
    },
    kitsu: {
      id: kitsuResult.match?.id,
      score: kitsuResult.score,
      type: kitsuResult.matchType,
    },
    yugen: {
      id: yugenResult.match?.id,
      score: yugenResult.score,
      type: yugenResult.matchType,
    },
  };

  return { ...mergedInfo, mappings };
};
