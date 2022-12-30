import {
  CacheType,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";
import { filter } from "fuzzaldrin-plus";
import { DateTime } from "luxon";
import { Long } from "mongodb";
import { client } from "..";
import { getActionRow } from "../buttons/sendSong";
import {
  addTrade,
  createEvents,
  deleteEvents,
  fetchServerUser,
  fetchTrade,
  fetchTradeNames,
  fetchUser,
  getServer,
  postponeEvents,
  setTradeEndDate,
} from "../mongo";
import { DiscordCommand, InServer, Trade } from "../types";
import {
  createProfileEmbed,
  createTrade,
  endPhase2,
  generateTimestamp,
  isAdmin,
  isInServer,
} from "../util";

const trade: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("trade")
    .setDescription("Create, extend, or stop song trades")
    .addSubcommand((builder) =>
      builder
        .setName("start")
        .setDescription("Start a song trade")
        .addIntegerOption((option) =>
          option
            .setName("deadline")
            .setDescription(
              "The number of days to allot people to send in their song recommendations"
            )
            .setMinValue(1)
            .setRequired(true)
        )
    )
    .addSubcommand((builder) =>
      builder
        .setName("stop")
        .setDescription("Stop a song trade")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name of the song trade to stop")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand((builder) =>
      builder
        .setName("extend")
        .setDescription("Extend the deadline for a song trade")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription(
              "The name of the song trade to extend the deadline of"
            )
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("days")
            .setDescription("The number of days to extend the deadline by")
            .setMinValue(1)
            .setRequired(true)
        )
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!isInServer(interaction) || !isAdmin(interaction)) return;

    switch (interaction.options.getSubcommand()) {
      case "start":
        await tradeStart(interaction);
        return;

      case "stop":
        await tradeStop(interaction);
        return;

      case "extend":
        await tradeExtend(interaction);
        return;

      default:
        interaction.reply({
          content: "How did you call a subcommand that doesn't exist!?",
          ephemeral: true,
        });
    }
  },

  async autocomplete(interaction) {
    if (
      !interaction.guildId ||
      !(interaction.member instanceof GuildMember) ||
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    )
      // invalid conditions
      return;

    // only name is autocompleted
    const focusedValue = interaction.options.getFocused();
    const tradeNames = await fetchTradeNames(new Long(interaction.guildId));
    if (focusedValue.length) {
      const filtered = filter(tradeNames, focusedValue);

      await interaction.respond(
        filtered.map((choice) => ({ name: choice, value: choice }))
      );
    } else {
      await interaction.respond(
        tradeNames.map((choice) => ({ name: choice, value: choice }))
      );
    }
  },
};

export default trade;

/**
 * Handles the "trade start" subcommand
 *
 * @param interaction the interaction to handle
 * @returns a Promise that resolves when the interaction has been completed
 */
async function tradeStart(
  interaction: InServer<ChatInputCommandInteraction<CacheType>>
) {
  await interaction.deferReply({ ephemeral: true });

  // create server object
  const server = await getServer(new Long(interaction.guildId));
  if (!server) {
    await interaction.editReply(
      "Something went horribly wrong! Please let the server owner know that the bot set up the server wrong!"
    );
    return;
  }
  if (!server.users.length) {
    await interaction.editReply(
      "There are no opted-in users! A song trade can't happen without people wanting to do it."
    );
    return;
  }

  const deadline = interaction.options.getInteger("deadline", true);
  // create and add trade object
  const trade: Trade = createTrade(server, deadline);

  const newID = await addTrade(trade);

  await interaction.editReply(
    newID
      ? `Started a new trade, "${trade.name}"!`
      : "Something went horribly wrong! Please let the server owner know that you can't start trades!"
  );

  // loop invariates
  const endTime = DateTime.fromJSDate(trade.end),
    timestamp = generateTimestamp(endTime, "F"),
    relTimestamp = generateTimestamp(endTime, "R");

  // message all needed people
  for (const edge of trade.trades) {
    const { from, to } = edge;

    // ensure user exists before DM
    const user = client.users.cache.get(from.toString());
    if (!user) {
      console.warn(`User ${from} doesn't exist!`);
      continue;
    }

    // ensure opposing user exists
    const toProfile = await fetchUser(to);
    if (!toProfile) {
      console.warn(`User ${to} doesn't exist!`);
      continue;
    }
    const toServerProfile = await fetchServerUser(trade.server, to);
    if (!toServerProfile) {
      console.warn(
        `User ${to} doesn't hasn't opted in (ever) to ${trade.server}!`
      );
      continue;
    }
    const nickname = toServerProfile.nickname ?? toProfile.name;

    const embed = createProfileEmbed(toProfile, nickname);
    await user.send(
      embed
        ? {
            content: `**Hello there!** For the new song trade (${trade.name}), you have been given ${nickname}.
You have until ${timestamp} (${relTimestamp}) to send your song suggestion through the form below.

Here is their music profile:`,
            embeds: [embed.setFooter({ text: "Happy Trading!" })],
            components: [getActionRow(trade.name)],
          }
        : {
            content: `**Hello there!** For the new song trade (${trade.name}), you have been given ${nickname}.
You have until ${timestamp} (${relTimestamp}) to send your song suggestion through the form below.

Unfortunately, it seems that ${nickname} hasn't set up their music profile, so try your best to pick out what you think they would like! Good luck, and happy trading!`,
            components: [getActionRow(trade.name)],
          }
    );
  }
  if (server.announcementsChannel) {
    const channel = client.channels.cache.get(
      server.announcementsChannel.toString()
    );

    if (channel?.isTextBased()) {
      const mention = server.pingableRole
        ? `<@&${server.pingableRole}>`
        : "everyone";
      await channel.send(
        `_Trade ${trade.name}_

Hey, ${mention}! A new song trade is starting!
Those of you who have opted in should have recieved a DM that tells you who you have and what kind of music they're looking for.
Make sure you send over the songs by ${timestamp}!
        
**Happy trading!**`
      );
    } else
      console.warn(
        `Channel ${server.announcementsChannel.toString()} isn't a valid channel!`
      );
  }

  const endOfPhase1 = DateTime.now().plus({ days: deadline }),
    endOfPhase2 = endOfPhase1.plus({ minutes: server.commentPeriod });
  const epJS1 = endOfPhase1.toJSDate(),
    epJS2 = endOfPhase2.toJSDate();
  const createEventsResult = await createEvents([
    {
      of: { server: trade.server, trade: trade.name, type: "phase1" },
      baseline: new Date(),
      time: epJS1,
      data: "phase1",
    },
    {
      of: { server: trade.server, trade: trade.name, type: "reminder" },
      baseline: epJS1,
      time: endOfPhase1.minus({ minutes: server.reminderPeriod }).toJSDate(),
      data: "phase1",
    },
    {
      of: { server: trade.server, trade: trade.name, type: "phase2" },
      baseline: epJS1,
      time: epJS2,
      data: "phase2",
    },
    {
      of: { server: trade.server, trade: trade.name, type: "reminder" },
      baseline: epJS2,
      time: endOfPhase2.minus({ minutes: server.reminderPeriod }).toJSDate(),
      data: "phase2",
    },
  ]);
  if (!createEventsResult) {
    console.warn("Could not create events for trade", trade.name);
  }
}

/**
 * Handles the "trade stop" subcommand
 *
 * @param interaction the interaction to handle
 * @returns a Promise that resolves when the interaction has been completed
 */
async function tradeStop(
  interaction: InServer<ChatInputCommandInteraction<CacheType>>
) {
  await interaction.deferReply({ ephemeral: true });

  const name = interaction.options.getString("name", true);
  const server = new Long(interaction.guildId);
  const deleted = await deleteEvents({
    trade: name,
    server,
  });

  if (deleted === 0) {
    // not successful
    await interaction.editReply(
      "Sorry, that music trade has already ended, doesn't exist, or you don't have access to it."
    );
    return;
  }

  await interaction.editReply(`Successfully stopped trade "${name}".`);

  await endPhase2({ server, trade: name, type: "phase2" });
}

/**
 * Handles the "trade extend" subcommand
 *
 * @param interaction the interaction to handle
 * @returns a Promise that resolves when the interaction has been handled
 */
async function tradeExtend(
  interaction: InServer<ChatInputCommandInteraction<CacheType>>
) {
  await interaction.deferReply({ ephemeral: true });

  const name = interaction.options.getString("name", true);
  const trade = await fetchTrade(name);

  if (!trade) {
    await interaction.editReply("That trade doesn't exist!");
    return;
  }
  if (trade.server !== new Long(interaction.guildId)) {
    await interaction.editReply(
      "You don't have permission to edit this interaction!"
    );
    return;
  }
  if (trade.end < new Date()) {
    await interaction.editReply("This trade has already ended!");
    return;
  }

  const days = Math.floor(interaction.options.getInteger("days", true));
  const newEnd = DateTime.fromJSDate(trade.end).plus({ days });
  const success =
    (await setTradeEndDate(name, newEnd.toJSDate())) &&
    (await postponeEvents({ trade: trade.name }, days * 1440));

  await interaction.editReply(
    success
      ? `Successfully extended the deadline of ${name} by ${days} days!`
      : "Something went horribly wrong! Please let the server owner know that you can't extend deadlines of trades!"
  );

  for (const { from, song } of trade.trades) {
    const u = client.users.cache.get(from.toString());
    if (!u) {
      console.warn(`User ${from} doesn't exist!`);
      continue;
    }

    const timestamp = generateTimestamp(newEnd, "F"),
      relTimestamp = generateTimestamp(newEnd, "R");
    u.send(
      song
        ? `One of the trades you are participating in (${trade.name}) has extended their deadline for submitting songs.
The new deadline is ${timestamp} (${relTimestamp}). Hang on tight while others are submitting their songs!`
        : `One of the trades you are participating in (${trade.name}) has extended their deadline for submitting songs.
You now have until ${timestamp} (${relTimestamp}) to submit your song trade. Remember to submit it on time!`
    );
  }
}
