import {
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type { DiscordCommand } from "../types";
import { optIn, optOut } from "../util";

const opt: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("opt")
    .setDescription("Opts in or out to this server's song trades.")
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((builder) =>
      builder
        .setName("in")
        .setDescription("Opts in to this server's song trades.")
    )
    .addSubcommand((builder) =>
      builder
        .setName("out")
        .setDescription("Opts out of this server's music trades")
    ),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case "in":
        await optIn(interaction);
        return;

      case "out":
        await optOut(interaction);
        return;

      default:
        await interaction.reply({
          content: "How did you call a subcommand that doesn't exist!?",
          flags: MessageFlags.Ephemeral,
        });
    }
  },
};

export default opt;
