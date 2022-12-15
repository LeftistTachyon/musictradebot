import { Long } from "bson";
import { randomInt } from "crypto";
import {
  CacheType,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  PermissionsBitField,
} from "discord.js";
import { DateTime } from "luxon";
import adjectives from "../data/adjectives.json";
import nouns from "../data/nouns.json";
import { Server, Trade, User } from "./types";

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

/**
 * Generates a music profile printout for the given user.
 *
 * @param u the user to generate the profile printout for
 * @returns the profile printout
 */
export function profileString(u: User) {
  let output = u.bio ? `*${u.bio}*` : "";
  if (u.likedGenres) output += `\n\n__Liked Genres__:\n\`${u.likedGenres}\``;
  if (u.dislikedGenres)
    output += `\n\n__Disliked Genres__:\n\`${u.dislikedGenres}\``;
  if (u.artists)
    output += `\n\n__Artists Mostly Listened To__:\n\`${u.artists}\``;
  if (u.favoriteSongs)
    output += `\n\n__Favorite Songs__:\n\`${u.favoriteSongs}\``;
  if (u.newlyDiscovered)
    output += `\n\n__Newly Discovered Artists__:\n\`${u.artists}\``;
  if (u.favoriteSounds)
    output += `\n\n__Favorite Sounds__:\n\`${u.favoriteSounds}\``;
  if (u.instruments) output += `\n\n__Instruments__:\n\`${u.instruments}\``;

  return output;
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

/**
 * Check if a slash command interaction is in a server
 *
 * @param interaction the interaction to check
 * @returns whether the interaction was in a server
 */
export function isInServer(
  interaction: ChatInputCommandInteraction<CacheType>
): interaction is ChatInputCommandInteraction<CacheType> & { guildId: string } {
  if (interaction.guildId) return true;

  interaction.reply({
    content: "Sorry, this command only works in servers I'm in!",
    ephemeral: true,
  });

  return false;
}

/**
 * Check if a slash command interaction was done by a server admin
 *
 * @param interaction the interaciton to check
 * @returns whether the interaction was done by a server admin
 */
export function isAdmin(interaction: ChatInputCommandInteraction<CacheType>) {
  if (
    interaction.member instanceof GuildMember &&
    interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
  )
    return true;

  interaction.reply({
    content: "Sorry, this command can only be used by (human) admins!",
    ephemeral: true,
  });

  return false;
}
