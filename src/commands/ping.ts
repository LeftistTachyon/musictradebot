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
    const discordLatency = -DateTime.fromJSDate(sent.interaction.createdAt)
      .diffNow()
      .toMillis();
    await interaction.editReply(
      `Pong!
Roundtrip latency: ${discordLatency} ms`
    );

    const beforeNow = DateTime.now();
    await pingDB();

    const databaseLatency = -beforeNow.diffNow().toMillis();
    await interaction.editReply(
      `Pong!
Roundtrip latency: ${discordLatency} ms
Database latency: ${databaseLatency} ms`
    );
  },
};

export default ping;
