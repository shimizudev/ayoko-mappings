import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import { getAnimeInfo } from "./lib/mappings";
import { getTrendingAnime, getPopularAnime } from "./lib/seasonal";
import Anime from "./schema/anime";
import mongoose from "mongoose";
import cron from "node-cron";

const app = new Hono();

await mongoose.connect(process.env.MONGO_URI!);
console.log("MongoDB Connected.");

app.use(cors());
app.use(prettyJSON());

app.get("/", (c) =>
  c.json({
    message: "Hello, world",
    routes: ["/info/:id", "/search", "/advanced-search"],
  })
);

const trendingCache = new Map();
const popularCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000;

const updateCache = (cache: Map<string, any>, key: string, data: any) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

const getDataFromCacheOrFetch = async (
  cache: Map<string, any>,
  key: string,
  fetchFunction: () => Promise<any>
) => {
  const cachedData = cache.get(key);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  const newData = await fetchFunction();
  updateCache(cache, key, newData);
  return newData;
};

app.get("/trending", async (c) => {
  try {
    const { page = 1, limit = 20, fields } = c.req.query();

    const selectedFields = fields
      ? fields.split(",").join(" ")
      : "title id idMal coverImage bannerImage mappings episodes averageScore genres";

    const trendingAnime = await getDataFromCacheOrFetch(
      trendingCache,
      `trending:${page}:${limit}`,
      async () => {
        const trendingIds = await getTrendingAnime(Number(page), Number(limit));
        const animeData = await Promise.all(
          trendingIds.map(async (id) => {
            let anime = await Anime.findOne({ id: String(id) }).select(
              selectedFields
            );
            if (!anime) {
              try {
                console.log("Getting info for", id);
                const info = await getAnimeInfo(String(id));
                anime = new Anime(info);
                await anime.save();
                console.log("Saved info for", id);
              } catch (error) {
                console.log("Errored on id", id);
              }
            }
            anime = await Anime.findOne({ id: String(id) }).select(
              selectedFields
            );

            return anime;
          })
        );
        return animeData;
      }
    );

    return c.json(trendingAnime);
  } catch (error) {
    console.error("Error fetching trending anime:", error);
    return c.json({ message: "Error fetching trending anime" }, 500);
  }
});

app.get("/popular", async (c) => {
  try {
    const { page = 1, limit = 20, fields } = c.req.query();

    const selectedFields = fields
      ? fields.split(",").join(" ")
      : "title id idMal coverImage bannerImage mappings episodes averageScore genres";

    const popularAnime = await getDataFromCacheOrFetch(
      popularCache,
      `popular:${page}:${limit}`,
      async () => {
        const popularIds = await getPopularAnime(Number(page), Number(limit));
        const animeData = await Promise.all(
          popularIds.map(async (id) => {
            let anime = await Anime.findOne({ id: String(id) }).select(
              selectedFields
            );
            if (!anime) {
              try {
                console.log("Getting info for", id);
                const info = await getAnimeInfo(String(id));
                anime = new Anime(info);
                await anime.save();
                console.log("Saved info for", id);
              } catch (error) {
                console.log("Errored on id", id);
              }
            }
            anime = await Anime.findOne({ id: String(id) }).select(
              selectedFields
            );

            return anime;
          })
        );
        return animeData;
      }
    );

    return c.json(popularAnime);
  } catch (error) {
    console.error("Error fetching popular anime:", error);
    return c.json({ message: "Error fetching popular anime" }, 500);
  }
});

app.get("/info/:id", async (c) => {
  const id = c.req.param("id");
  const fields = c.req.query("fields");

  const selectedFields = fields ? fields.split(",").join(" ") : "";

  const animeExists = await Anime.findOne({ id: id }).select(selectedFields);

  if (animeExists) {
    return c.json(animeExists);
  }

  console.log(`Anime id ${id} doesn't exist. Fetching and saving...`);

  const info = await getAnimeInfo(id);

  const anime = new Anime(info);
  await anime.save();

  const find = await Anime.findOne({ id: id }).select(selectedFields);

  return c.json(find);
});

app.get("/search", async (c) => {
  const { query, limit = 20, page = 1, fields } = c.req.query();
  const skip = (Number(page) - 1) * Number(limit);

  if (!query) {
    return c.json({ message: "Query parameter is required" }, 400);
  }

  const defaultFields =
    "title id idMal coverImage bannerImage mappings episodes averageScore genres";
  const selectedFields = fields ? fields.split(",").join(" ") : defaultFields;

  const animeResults = await Anime.find({
    $or: [
      { "title.romaji": { $regex: query, $options: "i" } },
      { "title.english": { $regex: query, $options: "i" } },
      { "title.native": { $regex: query, $options: "i" } },
    ],
  })
    .select(selectedFields)
    .skip(skip)
    .limit(Number(limit));

  if (animeResults.length === 0) {
    return c.json({ message: "No anime found" }, 404);
  }

  return c.json(animeResults);
});

app.get("/advanced-search", async (c) => {
  const {
    title,
    id,
    idMal,
    episodes,
    genres,
    tags,
    year,
    month,
    day,
    status,
    synonyms,
    averageScore,
    duration,
    startDate,
    endDate,
    countryOfOrigin,
    format,
    season,
    popularity,
    trending,
    updatedAt,
    ageRating,
    ageRatingGuide,
    episodeCount,
    totalLength,
    excludingGenres,
    excludingTags,
    excludingStatus,
    excludingFormat,
    limit = 20,
    page = 1,
    fields,
  } = c.req.query();
  const skip = (Number(page) - 1) * Number(limit);

  const searchCriteria: any = {};

  if (title) {
    searchCriteria.$or = [
      { "title.romaji": { $regex: title, $options: "i" } },
      { "title.english": { $regex: title, $options: "i" } },
      { "title.native": { $regex: title, $options: "i" } },
    ];
  }

  if (id) searchCriteria.id = id;
  if (idMal) searchCriteria.idMal = idMal;
  if (episodes) searchCriteria.episodes = parseInt(episodes);
  if (averageScore) searchCriteria.averageScore = parseInt(averageScore);
  if (duration) searchCriteria.duration = parseInt(duration);
  if (countryOfOrigin)
    searchCriteria.countryOfOrigin = { $regex: countryOfOrigin, $options: "i" };
  if (format) searchCriteria.format = { $regex: format, $options: "i" };
  if (season) searchCriteria.season = { $regex: season, $options: "i" };
  if (popularity) searchCriteria.popularity = parseInt(popularity);
  if (trending) searchCriteria.trending = parseInt(trending);
  if (updatedAt) searchCriteria.updatedAt = parseInt(updatedAt);
  if (ageRating)
    searchCriteria.ageRating = { $regex: ageRating, $options: "i" };
  if (ageRatingGuide)
    searchCriteria.ageRatingGuide = { $regex: ageRatingGuide, $options: "i" };
  if (episodeCount) searchCriteria.episodeCount = parseInt(episodeCount);
  if (totalLength) searchCriteria.totalLength = parseInt(totalLength);

  if (year || month || day) {
    searchCriteria.startDate = {};
    if (year) searchCriteria.startDate.year = parseInt(year);
    if (month) searchCriteria.startDate.month = parseInt(month);
    if (day) searchCriteria.startDate.day = parseInt(day);
  }
  if (startDate) searchCriteria.startDate = { $gte: new Date(startDate) };
  if (endDate) searchCriteria.endDate = { $lte: new Date(endDate) };
  if (status) searchCriteria.status = { $regex: status, $options: "i" };
  if (genres) searchCriteria.genres = { $in: genres.split(",") };
  if (tags) searchCriteria["tags.name"] = { $in: tags.split(",") };
  if (synonyms) searchCriteria.synonyms = { $in: synonyms.split(",") };
  if (excludingGenres)
    searchCriteria.genres = { $nin: excludingGenres.split(",") };
  if (excludingTags)
    searchCriteria["tags.name"] = { $nin: excludingTags.split(",") };
  if (excludingStatus)
    searchCriteria.status = { $nin: excludingStatus.split(",") };
  if (excludingFormat)
    searchCriteria.format = { $nin: excludingFormat.split(",") };

  const defaultFields =
    "title id idMal coverImage bannerImage mappings episodes averageScore genres";
  const selectedFields = fields ? fields.split(",").join(" ") : defaultFields;

  const animeResults = await Anime.find(searchCriteria)
    .select(selectedFields)
    .skip(skip)
    .limit(Number(limit));

  if (animeResults.length === 0) {
    return c.json({ message: "No anime found" }, 404);
  }

  return c.json(animeResults);
});

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running anime refetch cron job...");

    const animesToUpdate = await Anime.find({
      status: { $nin: ["FINISHED", "CANCELLED", "UNKNOWN"] },
    });

    for (const anime of animesToUpdate) {
      console.log(`Refetching data for anime ID: ${anime.id}`);

      const updatedInfo = await getAnimeInfo(anime.id);

      await Anime.updateOne({ id: anime.id }, updatedInfo);

      console.log(`Updated anime ID: ${anime.id}`);
    }
  } catch (error) {
    console.error("Error running cron job:", error);
  }
});

app.get("*", (c) =>
  c.json(
    {
      message: "Not found",
    },
    404
  )
);

export default {
  port: 3005,
  fetch: app.fetch,
};

console.log("App started");
