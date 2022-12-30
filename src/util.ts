import { Long } from "bson";
import { randomInt } from "crypto";
import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField,
} from "discord.js";
import { DateTime } from "luxon";
import { client } from ".";
import adjectives from "../data/adjectives.json";
import nouns from "../data/nouns.json";
import {
  addServerUser,
  fetchServerUser,
  fetchTrade,
  fetchUser,
  getServer,
  setOpt,
} from "./mongo";
import { InServer, MusicEvent, Server, Trade, User } from "./types";

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
  while (fromUnchosen.length > 1) {
    let fromIdx, toIdx;
    do {
      fromIdx = randomInt(fromUnchosen.length);
      toIdx = randomInt(toUnchosen.length);
    } while (fromUnchosen[fromIdx] === toUnchosen[toIdx]);

    trades.push({
      from: fromUnchosen.splice(fromIdx, 1)[0],
      to: toUnchosen.splice(toIdx, 1)[0],
    });
  }
  trades.push({ from: fromUnchosen[0], to: toUnchosen[0] });

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
 * Gets the default setting for the given setting
 *
 * @param setting the setting to fetch
 * @returns the default value for this setting, in hours
 */
export function getDefaultTimeframes(setting: string) {
  switch (setting) {
    case "reminderPeriod":
      return 24;
    case "commentPeriod":
      return 48;
    default:
      return 0;
  }
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
  return `<t:${Math.floor(time.toSeconds())}:${format}>`;
}

/**
 * Check if a slash command interaction is in a server
 *
 * @param interaction the interaction to check
 * @returns whether the interaction was in a server
 */
export function isInServer(
  interaction:
    | ButtonInteraction<CacheType>
    | ChatInputCommandInteraction<CacheType>
): interaction is InServer<typeof interaction> {
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
export function isAdmin(
  interaction:
    | ButtonInteraction<CacheType>
    | ChatInputCommandInteraction<CacheType>
) {
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

/**
 * Opts the user in to the interaction server's song trades given an interaction
 *
 * @param interaction the interaction to respond to
 * @returns a blank Promise that resolves when this interaction is complete
 */
export async function optIn(
  interaction:
    | ChatInputCommandInteraction<CacheType>
    | ButtonInteraction<CacheType>
) {
  if (!isInServer(interaction)) return;

  await interaction.deferReply({ ephemeral: true });

  const serverID = new Long(interaction.guildId),
    userID = new Long(interaction.user.id);
  const user = await fetchUser(userID);
  if (!user) {
    await interaction.editReply(
      "You don't have an account yet! Register first before trying to opt into music trades."
    );
  }

  const successful = (await fetchServerUser(serverID, userID)) // if server user exists
    ? await setOpt(serverID, userID, true)
    : addServerUser(serverID, { uid: userID, optedIn: true });

  await interaction.editReply(
    successful
      ? `You have successfully opted into ${interaction.guild?.name}'s music trades!`
      : "Something went horribly wrong! Please let the server owner know that you can't opt into trades!"
  );
}

/**
 * Opts the user out of the interaction server's song trades given an interaction
 *
 * @param interaction the interaction to respond to
 * @returns a blank Promise that respolves when this interaction is complete
 */
export async function optOut(
  interaction:
    | ChatInputCommandInteraction<CacheType>
    | ButtonInteraction<CacheType>
) {
  if (!isInServer(interaction)) return;

  await interaction.deferReply({ ephemeral: true });

  const serverID = new Long(interaction.guildId),
    userID = new Long(interaction.user.id);
  const user = await fetchUser(userID);
  if (!user) {
    await interaction.editReply(
      "You don't have an account yet! Register first before trying to opt out of music trades."
    );
  }

  const successful = (await fetchServerUser(serverID, userID)) // if server user exists
    ? await setOpt(serverID, userID, false)
    : addServerUser(serverID, { uid: userID, optedIn: false });

  await interaction.editReply(
    successful
      ? `You have successfully opted out of ${interaction.guild?.name}'s music trades!`
      : "Something went horribly wrong! Please let the server owner know that you can't opt out of trades!"
  );
}

/**
 * Creates an embed that represents the profile for a user
 *
 * @param user the user to create the profile embed for
 * @param nickname the nickname to use for this user
 * @returns the created embed, if possible. Otherwise, null.
 */
export function createProfileEmbed(user: User, nickname = user.name) {
  const output = new EmbedBuilder().setTitle(nickname + "'s Music Profile");

  const u = client.users.cache.get(user.uid.toString()),
    avatarURL = u?.avatarURL();
  if (avatarURL) {
    output.setThumbnail(avatarURL);
  }
  if (u?.accentColor) {
    output.setColor(u.accentColor);
  }

  let populated = false;
  if (user.bio) {
    output.setDescription(user.bio);
    populated = true;
  }

  if (user.likedGenres) {
    output.addFields({
      name: "Liked Genres",
      value: "`" + user.likedGenres.replace("`", "") + "`",
    });
    populated = true;
  }

  if (user.dislikedGenres) {
    output.addFields({
      name: "Disliked Genres",
      value: "`" + user.dislikedGenres.replace("`", "") + "`",
    });
    populated = true;
  }

  if (user.artists) {
    output.addFields({
      name: "Artists Most Listened To",
      value: "`" + user.artists.replace("`", "") + "`",
    });
    populated = true;
  }

  if (user.favoriteSongs) {
    output.addFields({
      name: "Favorite Songs",
      value: "`" + user.favoriteSongs.replace("`", "") + "`",
    });
    populated = true;
  }

  if (user.newArtists) {
    output.addFields({
      name: "Newly Discovered Artists",
      value: "`" + user.newArtists.replace("`", "") + "`",
    });
    populated = true;
  }

  if (user.favoriteSounds) {
    output.addFields({
      name: "Favourite Sounds",
      value: "`" + user.favoriteSounds.replace("`", "") + "`",
    });
    populated = true;
  }

  if (user.instruments) {
    output.addFields({
      name: "Instruments",
      value: "`" + user.instruments.replace("`", "") + "`",
    });
    populated = true;
  }

  return populated ? output : null;
}

/**
 * Ends phase 1 and sends out any respective messages.
 *
 * @param event the event that triggered this function call
 */
export function endPhase1({ of }: MusicEvent) {}

/**
 * Ends phase 2 and sends out any respective messages.
 *
 * @param event the event that triggered this function call
 */
export function endPhase2({ of }: MusicEvent) {}

/**
 * Sends reminder messages to any stragglers from phase 1
 *
 * @param event the event that triggered this function call
 */
export async function remindPhase1({ of }: MusicEvent) {
  const trade = await fetchTrade(of.trade);
  if (!trade) {
    console.warn(`Trade ${of.trade} not found!`);
    return;
  }

  const timestamp = generateTimestamp(DateTime.fromJSDate(trade.end), "R");
  for (const { song, from } of trade.trades) {
    if (song) continue;

    const user = client.users.cache.get(from.toString());
    if (!user) {
      console.warn(`User ${from} doesn't exist!`);
      continue;
    }

    await user.send(
      `This is a gentle reminder to send in your song recommendations before the deadline! Submissions close ${timestamp}, so make sure you get it in before then, or else the trade will continue without you!`
    );
  }
}

/**
 * Sends reminder messages to any stragglers from phase 2
 *
 * @param event the event that triggered this function call
 */
export async function remindPhase2(event: MusicEvent) {
  const trade = await fetchTrade(event.of.trade);
  if (!trade) {
    console.warn(`Trade ${event.of.trade} not found!`);
    return;
  }

  const server = await getServer(event.of.server);
  if (!server) {
    console.warn(`Server ${event.of.server} not found!`);
    return;
  }

  const timestamp = generateTimestamp(DateTime.fromJSDate(event.baseline), "R");
  for (const { response, to } of trade.trades) {
    if (response) continue;

    const user = client.users.cache.get(to.toString());
    if (!user) {
      console.warn(`User ${to} doesn't exist!`);
      continue;
    }

    await user.send(
      `This is a gentle reminder to send in your song commentary before the deadline! Submissions close ${timestamp}. This is _optional_, but highly recommended so the song recommenders can get feedback.`
    );
  }
}
