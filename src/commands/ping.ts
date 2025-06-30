import { SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import { pingDB } from "../mongo";
import type { DiscordCommand } from "../types";

const ping: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription('Replies with "Pong!"'),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: "Pinging...",
      withResponse: true,
    });
    await interaction.editReply(
      `Pong!\nRoundtrip latency: ${
        sent.interaction.createdTimestamp - interaction.createdTimestamp
      } ms`
    );

    const beforeNow = DateTime.now();
    await pingDB();

    const d = beforeNow.diffNow();
    await interaction.editReply(
      `Pong!\nRoundtrip latency: ${
        sent.interaction.createdTimestamp - interaction.createdTimestamp
      } ms\nDatabase latency: ${-d.toMillis()} ms`
    );
  },
};

export default ping;
