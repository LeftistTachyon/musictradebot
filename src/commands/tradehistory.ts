import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { DiscordCommand } from "../types";
import { finishedTradeEdgeEmbed, isInServer } from "../util";
import { fetchServerUser, fetchUser, getIndividualTrades } from "../mongo";
import { Long } from "mongodb";

const tradeHistory: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("tradehistory")
    .setDescription("List previous song recommendations to or from a user")
    .addUserOption((input) =>
      input
        .setName("from")
        .setDescription("The user that recommended the song")
        .setRequired(false)
    )
    .addUserOption((input) =>
      input
        .setName("to")
        .setDescription("The user that recieved the song")
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!isInServer(interaction)) return;

    const channel = interaction.channel;
    if (!channel?.isSendable()) {
      await interaction.reply({
        content:
          "This channel is invalid. Try sending this command in a different channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // validate command
    const from = interaction.options.getUser("from", false),
      to = interaction.options.getUser("to", false);
    if (!to && !from) {
      // 400
      await interaction.reply({
        content:
          "Either the sender or the recipient of the songs need to be specified.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.deferReply();

    // fetch all valid trades
    const fromUID = from ? new Long(from.id) : undefined,
      toUID = to ? new Long(to.id) : undefined,
      guildID = new Long(interaction.guildId);
    const trades = await getIndividualTrades(guildID, fromUID, toUID);

    // fetch all users in this trade
    const allUsers: Set<Long> = new Set();
    for (const trade of trades) {
      allUsers.add(trade.from);
      allUsers.add(trade.to);
    }

    // fetch all nicknames
    const names: Record<string, string | undefined> = {};
    for (const userID of allUsers) {
      names[userID.toString()] =
        (await fetchServerUser(guildID, userID))?.nickname ??
        (await fetchUser(userID))?.name;
    }

    // send the message
    while (trades.length) {
      await channel.send({
        embeds: trades
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

    // send success command
    await interaction.editReply(
      from
        ? to
          ? `↓ Song trades from ${names[from.id.toString()]} to ${
              names[to.id.toString()]
            } ↓`
          : `↓ Song trades from ${names[from.id.toString()]} ↓`
        : to
        ? `↓ Song trades to ${names[to.id.toString()]} ↓`
        : "ERROR"
    );
  },
};

export default tradeHistory;
