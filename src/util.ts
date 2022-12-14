import { Long } from "bson";
import { randomInt } from "crypto";
import { DateTime } from "luxon";
import adjectives from "../data/adjectives.json";
import nouns from "../data/nouns.json";
import { Server, Trade } from "./types";

// ! ==================== DATA UTIL ===================== !
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
 * Creates a new default trade from the given server.
 * The phase 1 deadline is rounded down before being used.
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
    end = start.plus({ days: Math.floor(duration) }).endOf("day");

  return {
    name: generateTradeName(),
    server: server.uid,
    users,
    trades,
    start: start.toJSDate(),
    end: end.toJSDate(),
  };
}

/**
 * Extends the phase 1 deadline of the given trade by the given number of days.
 * The number of days is rounded down before being used in computations.
 *
 * @param trade the trade to alter
 * @param extendBy the number of days to extend the phase 1 deadline by
 * @returns the same trade, but with an extended deadline
 */
export function extendDeadline(trade: Trade, extendBy: number): Trade {
  trade.end = DateTime.fromJSDate(trade.end)
    .plus({
      days: Math.floor(extendBy),
    })
    .toJSDate();

  return trade;
}

// ! =================== DISCORD UTIL =================== !
/**
 * The various formats of Discord timestamps.
 *
 * * `R`: Relative Timestamp (0 seconds ago)
 * * `D`: Date Timestamp (March 5, 2020)
 * * `T`: Time Timestamp (11:28:27 AM)
 * * `t`: Short Time Timestamp (11:28 AM)
 * * `F`: Full Timestamp (Thursday, March 5, 2020 11:28:27 AM)
 */
type TimestampFormat = "R" | "D" | "T" | "t" | "F";

/**
 * Creates a Discord timestamp string based on the given parameters.
 *
 * @param time the time (in Luxon format) to format
 * @param format the kind of format to output
 * @returns the formatted timestamp string
 */
export function generateTimestamp(
  time: DateTime,
  format: TimestampFormat
): string {
  return `<t:${time.toSeconds()}:${format}>`;
}
