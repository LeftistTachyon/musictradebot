import { Long } from "bson";
import { randomInt } from "crypto";
import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Collection,
  EmbedBuilder,
  GuildMember,
  PermissionsBitField,
} from "discord.js";
import { DateTime } from "luxon";
import { client } from ".";
import adjectives from "../data/adjectives.json";
import nouns from "../data/nouns.json";
import { getActionRow } from "./buttons/sendComments";
import {
  addServerUser,
  fetchServerUser,
  fetchTrade,
  fetchUser,
  getServer,
  setOpt,
} from "./mongo";
import { EventOf, InServer, MusicEvent, Server, Trade, User } from "./types";

// ! ================== PASTEBIN INIT =================== !

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
export async function endPhase1({ of }: MusicEvent) {
  const trade = await fetchTrade(of.trade);
  if (!trade) {
    console.warn(`Trade ${of.trade} doesn't exist!`);
    return;
  }
  const server = await getServer(of.server);
  if (!server) {
    console.warn(`Server ${of.server} doesn't exist!`);
    return;
  }

  for (const { from, to, song } of trade.trades) {
    const fromName =
      (await fetchServerUser(of.server, from))?.nickname ??
      (await fetchUser(from))?.name;
    if (!fromName) {
      console.warn(`User ${from} has no profile!`);
      continue;
    }

    const user = client.users.cache.get(to.toString());
    if (!user) {
      console.warn(`User ${to} doesn't exist!`);
      continue;
    }

    const phase2End = DateTime.fromJSDate(trade.end).plus({
      minutes: server.commentPeriod,
    });
    const relTimestamp = generateTimestamp(phase2End, "R"),
      fullTimestamp = generateTimestamp(phase2End, "F");
    if (song) {
      const embed = new EmbedBuilder()
        .setTitle("Your song recommenation")
        .setDescription(song.song)
        .setFooter({ text: "Happy listening!" });
      if (song.comments)
        embed.addFields({ name: "Comments", value: song.comments });

      await user.send({
        content: `**Welcome to part 2 of the song trade!**
This is where you get the opportunity to listen and respond to the song that your recommender sent. Sending in a response is optional, but greatly appreciated!
Submissions close at ${fullTimestamp} (${relTimestamp}). Have fun!
Song: ${song.song}`,
        embeds: [embed],
        components: [getActionRow(trade.name)],
      });
    } else {
      await user.send(
        `**Welcome to part 2 of the song trade!**
Unfortunately, your song recommender didn't send in a song in time. Sit tight until ${fullTimestamp} (${relTimestamp}) to see everybody's results!
If this is a recurring issue, please let your server owner know to exclude the offender from the next song trades.`
      );
    }
  }
}

/**
 * Ends phase 2 and sends out any respective messages.
 *
 * @param event the event that triggered this function call
 */
export async function endPhase2({
  server: serverID,
  trade: tradeName,
}: EventOf) {
  const server = await getServer(serverID);
  if (!server) {
    console.warn(`Server ${serverID} doesn't exist!`);
    return;
  }

  const trade = await fetchTrade(tradeName);
  if (!trade) {
    console.warn(`Trade ${tradeName} doesn't exist!`);
    return;
  }

  const guild = client.guilds.cache.get(serverID.toString());
  if (!guild) {
    console.warn(`Guild ${serverID} doesn't exist!`);
    return;
  }

  const names = new Collection<Long, string | undefined>();
  for (const userID of trade.users) {
    names.set(
      userID,
      (await fetchServerUser(serverID, userID))?.nickname ??
        (await fetchUser(userID))?.name
    );
  }

  if (server.announcementsChannel) {
    // send via announcements channel
    const announcementsChannel = await guild.channels.fetch(
      server.announcementsChannel.toString()
    );

    if (announcementsChannel?.isTextBased()) {
      const mention = server.pingableRole
        ? `<@&${server.pingableRole}>`
        : "everyone";
      const edges = trade.trades.slice();

      await announcementsChannel.send({
        content: `**End of trade ${tradeName}**
Hello, ${mention}! Thank you for participating in another round of song trades. We'll be looking forward to doing this again, soon!
Below are all the song trades that happened this time around:`,
        embeds: edges
          .splice(0, 10)
          .map((edge) =>
            finishedTradeEdgeEmbed(
              edge,
              names.get(edge.from),
              names.get(edge.to)
            )
          ),
      });

      while (edges.length) {
        await announcementsChannel.send({
          embeds: edges
            .splice(0, 10)
            .map((edge) =>
              finishedTradeEdgeEmbed(
                edge,
                names.get(edge.from),
                names.get(edge.to)
              )
            ),
        });
      }
    } else {
      console.warn(
        `Announcements channel ${server.announcementsChannel} is invalid!`
      );
      // fall through to below DM method
    }
  }

  // send via DMs to everybody involved
}

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
  for (const { song, response, to } of trade.trades) {
    if (response || !song) continue;

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

/**
 * Creates an embed that contains all relevant information from this trade
 *
 * @param edge the edge
 * @param fromName the nickname to use for the sender
 * @param toName the nickname to use for the reciever
 * @returns the embed that includes all info from the edge
 */
function finishedTradeEdgeEmbed(
  edge: Trade["trades"][number],
  fromName?: string,
  toName?: string
) {
  const output = new EmbedBuilder().setTitle(`${fromName} ➡ ${toName}`);

  if (edge.song) {
    output.addFields({
      name: fromName + "'s song suggestion",
      value: edge.song.song,
    });

    if (edge.song.comments) {
      output.addFields({
        name: fromName + "'s comments",
        value: edge.song.comments,
      });
    }

    if (edge.response) {
      output.addFields({ name: "\u200B", value: "\u200B" });
    }
  }

  if (edge.response) {
    output.addFields({
      name: toName + "'s rating",
      value: edge.response.rating + " / 10",
    });

    if (edge.response.comments) {
      output.addFields({
        name: toName + "'s comments",
        value: edge.response.comments,
      });
    }
  }

  return output;
}
