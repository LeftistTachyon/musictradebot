import { Long } from "bson";
import { randomInt } from "crypto";
import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  PermissionsBitField,
} from "discord.js";
import { DateTime } from "luxon";
import { ExpireDate, PasteClient, Publicity } from "pastebin-api";
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
  setStage,
} from "./mongo";
import type {
  EventOf,
  EventSelector,
  InServer,
  Server,
  Trade,
  User,
} from "./types";

// ! ================== PASTEBIN INIT =================== !
const pastebinClient = new PasteClient(
  process.env.PASTEBIN_KEY ?? "missing pastebin key"
);

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
    end = start.plus({ days: duration }).endOf("day");
  // const start = DateTime.now(),
  //   end = start.plus({ days: duration });

  return {
    name: generateTradeName(),
    server: server.uid,
    users,
    trades,
    start: start.toJSDate(),
    end: end.toJSDate(),
    phase: "phase1",
  };
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
    flags: MessageFlags.Ephemeral,
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
    flags: MessageFlags.Ephemeral,
  });

  return false;
}

/**
 * Check if a slash command interaction was done by leafytachyon, the bot owner
 *
 * @param interaction the interaction to check
 * @returns whether the interaction was done by the one and only leafytachyon
 */
export function isBotOwner(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  if (interaction.user.id === process.env.MY_ID) return true;

  interaction.reply({
    content:
      "Sorry, this command can only be used by the bot owner!\nPlease contact leafytachyon for more information.",
  });
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

  // console.log("deferring reply...", {
  //   deferReply: interaction.deferReply,
  //   deferred: interaction.deferred,
  //   replied: interaction.replied,
  // });
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // console.log("attempting to fetch server user profile");
  const serverID = new Long(interaction.guildId),
    userID = new Long(interaction.user.id);
  const user = await fetchUser(userID);
  if (!user) {
    await interaction.editReply(
      "You don't have an account yet! Register first with `/profile create` before trying to opt into music trades."
    );
    return;
  }

  // console.log("attempting to opt in...");
  const successful = (await fetchServerUser(serverID, userID)) // if server user exists
    ? await setOpt(serverID, userID, true)
    : await addServerUser(serverID, { uid: userID, optedIn: true });

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

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
    : await addServerUser(serverID, { uid: userID, optedIn: false });

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
export async function createProfileEmbed(user: User, nickname = user.name) {
  const output = new EmbedBuilder().setTitle(nickname + "'s Music Profile");

  const u = await client.users.fetch(user.uid.toString()),
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
      value: "```" + user.likedGenres.replace("`", "") + "```",
    });
    populated = true;
  }

  if (user.dislikedGenres) {
    output.addFields({
      name: "Disliked Genres",
      value: "```" + user.dislikedGenres.replace("`", "") + "```",
    });
    populated = true;
  }

  if (user.artists) {
    output.addFields({
      name: "Artists Most Listened To",
      value: "```" + user.artists.replace("`", "") + "```",
    });
    populated = true;
  }

  if (user.favoriteSongs) {
    output.addFields({
      name: "Favorite Songs",
      value: "```" + user.favoriteSongs.replace("`", "") + "```",
    });
    populated = true;
  }

  if (user.newArtists) {
    output.addFields({
      name: "Newly Discovered Artists",
      value: "```" + user.newArtists.replace("`", "") + "```",
    });
    populated = true;
  }

  if (user.favoriteSounds) {
    output.addFields({
      name: "Favourite Sounds",
      value: "```" + user.favoriteSounds.replace("`", "") + "```",
    });
    populated = true;
  }

  if (user.instruments) {
    output.addFields({
      name: "Instruments",
      value: "```" + user.instruments.replace("`", "") + "```",
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
export async function endPhase1({
  server: serverID,
  trade: tradeName,
}: EventOf) {
  console.log("Attempting to end phase 1 of", tradeName);

  const trade = await fetchTrade(tradeName);
  if (!trade) {
    console.warn(`Trade ${tradeName} doesn't exist!`);
    return;
  }
  if (!(await setStage(tradeName, "phase2"))) {
    console.warn(`Unable to update trade ${tradeName} to phase 2!`);
    return;
  }

  const server = await getServer(serverID);
  if (!server) {
    console.warn(`Server ${serverID} doesn't exist!`);
    return;
  }

  for (const { from, to, song } of trade.trades) {
    const fromName =
      (await fetchServerUser(serverID, from))?.nickname ??
      (await fetchUser(from))?.name;
    if (!fromName) {
      console.warn(`User ${from} has no profile!`);
      continue;
    }

    const user = await client.users.fetch(to.toString());
    if (!user) {
      console.warn(`User ${to} doesn't exist!`);
      console.trace();
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
_NOTE: resubmitting overwrites your previous submission._`,
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
  console.log("Attempting to end phase 2 of", tradeName);

  const trade = await fetchTrade(tradeName);
  if (!trade) {
    console.warn(`Trade ${tradeName} doesn't exist!`);
    return;
  }
  if (!(await setStage(tradeName, "done"))) {
    console.warn(`Unable to update trade ${tradeName} to phase 2!`);
    return;
  }

  const server = await getServer(serverID);
  if (!server) {
    console.warn(`Server ${serverID} doesn't exist!`);
    return;
  }

  const guild = await client.guilds.fetch(serverID.toString());
  if (!guild) {
    console.warn(`Guild ${serverID} doesn't exist!`);
    return;
  }

  const names: Record<string, string | undefined> = {};
  for (const userID of trade.users) {
    names[userID.toString()] =
      (await fetchServerUser(serverID, userID))?.nickname ??
      (await fetchUser(userID))?.name;
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
        content: `_End of trade ${tradeName}_

Hello, ${mention}! Thank you for participating in another round of song trades. We'll be looking forward to doing this again, soon!
Below are all the song trades that happened this time around:`,
        embeds: edges
          .splice(0, 10)
          .map((edge) =>
            finishedTradeEdgeEmbed(
              edge,
              names[edge.from.toString()],
              names[edge.to.toString()]
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
                names[edge.from.toString()],
                names[edge.to.toString()]
              )
            ),
        });
      }

      return; // prevent fall-through
    } else {
      console.warn(
        `Announcements channel ${server.announcementsChannel} is invalid!`
      );
      // fall through to below DM method
    }
  }

  // send via DMs to everybody involved
  const url = await pastebinClient.createPaste({
    code: trade.trades
      .map((edge) =>
        finishedTradeEdgeText(
          edge,
          names[edge.from.toString()],
          names[edge.to.toString()]
        )
      )
      .join("\n\n"),
    expireDate: ExpireDate.Never,
    name: trade.name + ".md",
    publicity: Publicity.Public,
  });

  const message = `Thank you for taking part in trade ${tradeName}!
Here is a link to all of the song choices and responses: <${url}>

Hope to see you again in another trade!`;

  for (const user of trade.users) {
    const u = await client.users.fetch(user.toString());
    if (!u) {
      console.warn(`User ${user} doesn't exist!`);
      console.trace();
      continue;
    }

    await u.send(message);
  }
}

/**
 * Sends reminder messages to any stragglers from phase 1
 *
 * @param event the event that triggered this function call
 */
export async function remindPhase1({ trade: tradeName }: EventOf) {
  console.log("Attempting to remind for phase 1 of", tradeName);

  const trade = await fetchTrade(tradeName);
  if (!trade) {
    console.warn(`Trade ${tradeName} not found!`);
    return;
  }

  const timestamp = generateTimestamp(DateTime.fromJSDate(trade.end), "R");
  for (const { song, from } of trade.trades) {
    if (song) continue;

    const user = await client.users.fetch(from.toString());
    if (!user) {
      console.warn(`User ${from} doesn't exist!`);
      console.trace();
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
export async function remindPhase2({
  trade: tradeName,
  server: serverID,
}: EventOf) {
  console.log("Attempting to remind for phase 2 of", tradeName);

  const trade = await fetchTrade(tradeName);
  if (!trade) {
    console.warn(`Trade ${tradeName} not found!`);
    return;
  }

  const server = await getServer(serverID);
  if (!server) {
    console.warn(`Server ${serverID} not found!`);
    return;
  }

  const timestamp = generateTimestamp(
    DateTime.fromJSDate(trade.end).plus({ minutes: server.commentPeriod }),
    "R"
  );
  for (const { song, response, to } of trade.trades) {
    if (response || !song) continue;

    const user = await client.users.fetch(to.toString());
    if (!user) {
      console.warn(`User ${to} doesn't exist!`);
      console.trace();
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
  const output = new EmbedBuilder().setTitle(`${fromName} ➜ ${toName}`);

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

    output.addFields({ name: "\u200B", value: "\u200B" });
  } else {
    return output.addFields({
      name: fromName + "'s song suggestion",
      value: fromName + " did not submit a song.",
    });
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

    return output;
  } else {
    return output.addFields({
      name: toName + "'s rating",
      value: toName + " did not leave a rating.",
    });
  }
}

/**
 * Converts the edge into a string representation
 *
 * @param edge the edge to represent in text
 * @param fromName the name to use for the song sender
 * @param toName the name to user for the song recipient
 * @returns a string representation of the edge
 */
function finishedTradeEdgeText(
  edge: Trade["trades"][number],
  fromName?: string,
  toName?: string
) {
  let output = `# ${fromName} ➜ ${toName}`;

  if (edge.song) {
    output += `## ${fromName}'s song suggestion
${edge.song.song}
`;

    if (edge.song.comments) {
      output += `## ${fromName}'s comments",
${edge.song.comments}
`;
    }

    output += "\n";
  } else {
    return (
      output +
      `## ${fromName}'s song suggestion
${fromName} did not submit a song.
`
    );
  }

  if (edge.response) {
    output += `## ${toName}'s rating
${edge.response.rating} / 10
`;

    if (edge.response.comments) {
      output += `## ${toName}'s comments",
${edge.response.comments}
`;
    }

    return output;
  } else {
    return (
      output +
      `## ${toName}'s rating
${toName} did not leave a rating.
`
    );
  }
}
