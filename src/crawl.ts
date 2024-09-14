import ky from "ky";
import fs from "fs/promises";
import { getAnimeInfo } from "./lib/mappings";
import Anime from "./schema/anime"; // Save the info on this schema.
import mongoose from "mongoose";

const LAST_ID_FILE = "./lastId.txt";
const CHUNK_SIZE = 25; // Process 10 IDs at a time

await mongoose.connect(process.env.MONGO_URI!);

async function loadLastId(): Promise<string | null> {
  try {
    const lastId = await fs.readFile(LAST_ID_FILE, "utf-8");
    console.info(`Loaded last processed ID: ${lastId}`);
    return lastId;
  } catch (error) {
    console.warn("No lastId file found, starting fresh...");
    return null;
  }
}

async function saveLastId(id: string): Promise<void> {
  try {
    await fs.writeFile(LAST_ID_FILE, id);
    console.info(`Saved last processed ID: ${id}`);
  } catch (error) {
    console.error("Failed to save last ID:", error);
  }
}

async function processChunk(ids: string[]) {
  const promises = ids.map(async (id) => {
    try {
      console.debug(`Processing ID: ${id}`);
      const animeInfo = await getAnimeInfo(id);
      console.info(`Fetched info for ID: ${id}`);

      // Save animeInfo to the database using the Anime schema
      const existingAnime = await Anime.findOne({ id: animeInfo.id });
      if (existingAnime) {
        console.info(`Anime with ID: ${id} already exists, skipping...`);
      } else {
        const anime = new Anime(animeInfo);
        await anime.save();
        console.info(`Saved anime with ID: ${id} to the database`);
      }

      return id; // Return the successfully processed ID
    } catch (error) {
      console.error(`Failed to process ID: ${id}`, error);
      return null; // Return null in case of error
    }
  });

  return Promise.all(promises);
}

async function crawl() {
  try {
    const data = await ky.get(
      "https://raw.githubusercontent.com/5H4D0WILA/IDFetch/main/ids.txt"
    );
    const ids = (await data.text()).split("\n").filter(Boolean); // Remove empty lines
    console.info(`Loaded ${ids.length} IDs to process`);

    const lastId = await loadLastId();
    const startIndex = lastId ? ids.indexOf(lastId) + 1 : 0;

    if (startIndex >= ids.length) {
      console.info("All IDs have been processed");
      return;
    }

    for (let i = startIndex; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      console.info(`Processing chunk of IDs: ${chunk.join(", ")}`);

      const processedIds = await processChunk(chunk);

      // Find the last successfully processed ID in this chunk
      const lastProcessedId = processedIds.filter(Boolean).pop();
      if (lastProcessedId) {
        await saveLastId(lastProcessedId); // Save the last successfully processed ID
      }

      console.info(`Successfully processed chunk: ${chunk.join(", ")}`);
    }

    console.info("Crawling complete");
  } catch (error) {
    console.error("Failed to fetch ID list or process IDs:", error);
  }
}

crawl();
