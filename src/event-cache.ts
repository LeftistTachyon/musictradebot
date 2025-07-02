import { Client } from "discord.js";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { DateTime } from "luxon";
import { fetchTrade } from "./mongo";
import { setTimeout } from "timers/promises";
import { endPhase1, endPhase2, remindPhase1, remindPhase2 } from "./util";
import { WithId } from "mongodb";
import { Trade } from "./types";

type TradeEvent = {
  event: string;
  type: "end1" | "end2" | "remind1" | "remind2";
  time: Date;
};

let cache: TradeEvent[] = [];

/**
 * Returns all cached events
 * @returns all events
 */
export function getCache() {
  return cache;
}

/**
 * Adds the given events to the cache
 * @param events the events to add to the cache
 */
export function addEvents(events: TradeEvent[]) {
  cache = cache.concat(events);
}

/**
 * Trims the cache to only contain future events
 */
export function trimCache() {
  const now = new Date();
  cache = cache.filter((event) => now <= event.time);
}

/**
 * Saves the cache to disk
 * @param location the file location to save the cache to (optional)
 */
export async function saveCache(
  location: string = process.env.CACHE_FILE ?? "cache.json"
) {
  await writeFile(location, JSON.stringify(cache, null, 2), "utf8");
}

/**
 * Loads the cache from disk
 *
 * If the file does not exist, nothing happens.
 * @param location the file location to read the cache from (optional)
 */
export async function loadCache(
  location: string = process.env.CACHE_FILE ?? "cache.json"
) {
  if (!existsSync(location)) return;

  const file = await readFile(location, { encoding: "utf8" });
  cache = JSON.parse(file);
}

/**
 * Schedules all (valid) events stored in the in-memory cache
 * @param client the Discord.JS client to use to message users about events in ongoing trades
 * @returns a {@link Record} of string, {@link AbortController} pairs for stopping events
 */
export async function scheduleFromCache(client: Client<true>) {
  // a temp storage for all the ongoing trades
  const tradeCache: Record<string, WithId<Trade> | null> = {};
  // the output: all abort controllers for stopping various trades
  const controllers: Record<string, AbortController> = {};

  for (const tradeEvent of cache) {
    // fetch the trade
    const trade =
      tradeCache[tradeEvent.event] ||
      (tradeCache[tradeEvent.event] = await fetchTrade(tradeEvent.event));
    if (!trade) {
      console.warn(`Unable to find trade ${tradeEvent.event}!`);
      continue; // unable to find trade!
    }

    // calculate the amount of time in the future this is
    const millis = DateTime.fromJSDate(tradeEvent.time).diffNow().toMillis();
    if (millis < 0) {
      console.warn(
        `${tradeEvent.event}'s ${tradeEvent.type} is from the past!`
      );
      continue; // event from the past!
    }

    // find or create an abort controller
    const controller =
      controllers[tradeEvent.event] ||
      (controllers[tradeEvent.event] = new AbortController());
    const tradeParams = { server: trade.server, trade: trade.name };

    switch (tradeEvent.type) {
      case "end1":
        setTimeout(millis, tradeParams, { signal: controller.signal })
          .then((params) => endPhase1(params, client))
          .catch(console.warn); // ending phase 1
        break;

      case "remind1":
        setTimeout(millis, tradeParams, { signal: controller.signal })
          .then((params) => remindPhase1(params, client))
          .catch(console.warn); // reminder for phase 1
        break;

      case "end2":
        setTimeout(millis, tradeParams, { signal: controller.signal })
          .then((params) => endPhase2(params, client))
          .catch(console.warn); // ending phase 2
        break;

      case "remind2":
        setTimeout(millis, tradeParams, { signal: controller.signal })
          .then((params) => remindPhase2(params, client))
          .catch(console.warn); // reminder for phase 2
        break;
    }
  }

  return controllers;
}
