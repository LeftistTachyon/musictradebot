import {
  CacheType,
  ChatInputCommandInteraction,
  GuildMember,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";
import { filter } from "fuzzaldrin-plus";
import { DateTime } from "luxon";
import { Long } from "mongodb";
import { setTimeout } from "timers/promises";
import { client } from "..";
import { getActionRow } from "../buttons/sendSong";
import {
  addTrade,
  fetchServerUser,
  fetchTrade,
  fetchTradeNames,
  fetchUser,
  getServer,
  setStage,
} from "../mongo";
import type { DiscordCommand, InServer, Trade } from "../types";
import {
  createProfileEmbed,
  createTrade,
  endPhase1,
  endPhase2,
  generateTimestamp,
  generateTradeName,
  isAdmin,
  isInServer,
  remindPhase1,
  remindPhase2,
} from "../util";

const trade: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("trade")
    .setDescription("Create or stop song trades (Admin-only)")
    .addSubcommand((builder) =>
      builder
        .setName("start")
        .setDescription("Start a song trade")
        .addNumberOption((option) =>
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
    .setContexts(InteractionContextType.Guild)
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

      default:
        await interaction.reply({
          content: "How did you call a subcommand that doesn't exist!?",
          flags: MessageFlags.Ephemeral,
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

const tradeStops: Record<string, AbortController> = {};

/**
 * Handles the "trade start" subcommand
 *
 * @param interaction the interaction to handle
 * @returns a Promise that resolves when the interaction has been completed
 */
async function tradeStart(
  interaction: InServer<ChatInputCommandInteraction<CacheType>>
) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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

  const deadline = interaction.options.getNumber("deadline", true);

  // create and add trade object
  const trade: Trade = createTrade(server, deadline);
  while (await fetchTrade(trade.name)) trade.name = generateTradeName(); // avoid collisions
  console.log("New trade created:", trade.name);

  const newID = await addTrade(trade);

  await interaction.editReply(
    newID
      ? `Started a new trade, \`${trade.name}\`!`
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
    const user = await client.users.fetch(from.toString());
    if (!user) {
      console.warn(`User ${from} doesn't exist!`);
      console.trace();
      continue;
    }

    // ensure opposing user exists
    const toProfile = await fetchUser(to);
    if (!toProfile) {
      console.warn(`User ${to} doesn't exist!`);
      console.trace();
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

    const embed = await createProfileEmbed(toProfile, nickname);
    await user.send(
      embed
        ? {
            content: `**Hello there!** For the new song trade (\`${trade.name}\`), you have been given ${nickname}.
You have until ${timestamp} (${relTimestamp}) to send your song suggestion through the form below.
_NOTE: resubmitting overwrites your previous submission._

Here is their music profile:`,
            embeds: [embed.setFooter({ text: "Happy Trading!" })],
            components: [getActionRow(trade.name)],
          }
        : {
            content: `**Hello there!** For the new song trade (\`${trade.name}\`), you have been given ${nickname}.
You have until ${timestamp} (${relTimestamp}) to send your song suggestion through the form below.
_NOTE: resubmitting overwrites your previous submission._

Unfortunately, it seems that ${nickname} hasn't set up their music profile, so try your best to pick out what you think they would like! Good luck, and happy trading!`,
            components: [getActionRow(trade.name)],
          }
    );
  }

  // send server-wide announcement
  if (server.announcementsChannel) {
    const channel = await client.channels.fetch(
      server.announcementsChannel.toString()
    );

    if (channel?.isSendable()) {
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

  // calculate when each event should occur
  const endOfPhase1 = DateTime.fromJSDate(trade.end)
      .diff(DateTime.now())
      .toMillis(),
    endOfPhase2 = endOfPhase1 + server.commentPeriod * 60_000,
    reminderPeriod = server.reminderPeriod * 60_000;
  // console.log({ endOfPhase1, endOfPhase2, reminderPeriod });

  // set timeouts
  const controller = new AbortController();
  const tradeParams = { server: trade.server, trade: trade.name };
  setTimeout(endOfPhase1, tradeParams, { signal: controller.signal })
    .then(endPhase1)
    .catch(console.warn); // ending phase 1
  setTimeout(endOfPhase1 - reminderPeriod, tradeParams, {
    signal: controller.signal,
  })
    .then(remindPhase1)
    .catch(console.warn); // reminder for phase 1
  setTimeout(endOfPhase2, tradeParams, { signal: controller.signal })
    .then(endPhase2)
    .catch(console.warn); // ending phase 2
  setTimeout(endOfPhase2 - reminderPeriod, tradeParams, {
    signal: controller.signal,
  })
    .then(remindPhase2)
    .catch(console.warn); // reminder for phase 2

  tradeStops[trade.name] = controller;
  console.log(tradeStops);
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
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const name = interaction.options.getString("name", true);
  const server = new Long(interaction.guildId);
  const trade = await fetchTrade(name);
  if (!trade) {
    // not successful
    await interaction.editReply("Sorry, that music trade doesn't exist.");
    return;
  }

  const controller = tradeStops[name];
  if (!controller) {
    await interaction.editReply(
      "Sorry, that music trade has already ended or you don't have access to it."
    );
    return;
  }
  try {
    controller.abort("Trade stopped");
  } catch (e) {
    // const error = e as Error;
    // console.trace(error?.stack);
  }

  if (!(await setStage(name, "done"))) {
    await interaction.editReply(
      "Sorry, that music trade has ended already or you don't have access to it."
    );
    return;
  }

  for (const user of trade.users) {
    const u = await client.users.fetch(user.toString());
    if (!u) {
      console.warn(`User ${user} doesn't exist!`);
      console.trace();
      continue;
    }

    await u.send(
      `One of the trades you're participating in (\`${name}\`) has been canceled. Sorry for the inconvenience!`
    );
  }

  await interaction.editReply(`Successfully stopped trade \`${name}\`.`);

  await endPhase2({ server, trade: name });
}
