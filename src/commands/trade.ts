import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { DiscordCommand } from "../types";

const trade: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("trade")
    .setDescription("Create, extend, or stop song trades")
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
        .addNumberOption((option) =>
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
    if (interaction.guildId) {
      await interaction.deferReply({ ephemeral: true });
    } else
      interaction.reply({
        content: "Sorry, this command only works in servers I'm in!",
        ephemeral: true,
      });
  },
};

export default trade;
