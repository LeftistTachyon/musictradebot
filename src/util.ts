import { Long, ObjectId } from "bson";
import { Server, Trade } from "./types";
import adjectives from "../data/adjectives.json";
import nouns from "../data/nouns.json";
import { randomInt } from "crypto";
import { DateTime } from "luxon";

/**
 * Generates a random name for a trade. It is not guaranteed to be unique.
 *
 * @returns a randomly generated name for a trade
 */
export function generateTradeName() {
  const idx1 = randomInt(adjectives.length),
    idx2 = randomInt(adjectives.length - 1),
    idx3 = randomInt(nouns.length);

  return (
    adjectives[idx1] +
    "-" +
    adjectives[idx2 >= idx1 ? idx2 + 1 : idx2] +
    "-" +
    nouns[idx3]
  );
}

/**
 * Creates a new default trade from the given server
 *
 * @param server the server to generate a trade for
 * @param duration the duration (in days) that phase 1 of the trade should last
 * @returns the generated trade
 */
export function createTrade(server: Server, duration: number): Trade {
  // find participating users
  const users = server.users
    .filter((user) => user.optedIn)
    .map((user) => user.uid);

  // create random trade graph
  const fromUnchosen = users.slice(),
    toUnchosen = users.slice(),
    trades: { from: Long; to: Long }[] = [];
  while (fromUnchosen.length > 0) {
    trades.push({
      from: fromUnchosen.splice(randomInt(fromUnchosen.length), 1)[0],
      to: toUnchosen.splice(randomInt(toUnchosen.length), 1)[0],
    });
  }

  // calculate start and end times
  const start = DateTime.now().startOf("day"),
    end = start.plus({ days: duration }).endOf("day");

  return {
    name: generateTradeName(),
    server: server.uid,
    users,
    trades,
    start: start.toJSDate(),
    end: end.toJSDate(),
  };
}
