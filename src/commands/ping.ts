import { SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import { pingDB } from "../mongo";
import { DiscordCommand } from "../types";

const ping: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription('Replies with "Pong!"'),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });
    await interaction.editReply(
      `Pong!\nRoundtrip latency: ${
        sent.createdTimestamp - interaction.createdTimestamp
      } ms`
    );

    const beforeNow = DateTime.now();
    await pingDB();

    const d = beforeNow.diffNow();
    interaction.editReply(
      `Pong!\nRoundtrip latency: ${
        sent.createdTimestamp - interaction.createdTimestamp
      } ms\nDatabase latency: ${-d.toMillis()} ms`
    );
  },
};

export default ping;
