import {
  CacheType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { DiscordCommand } from "../types";
import { isAdmin, isInServer } from "../util";

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
};

export default trade;

async function tradeStart(interaction: ChatInputCommandInteraction<CacheType>) {
  await interaction.deferReply({ ephemeral: true });
}

async function tradeStop(interaction: ChatInputCommandInteraction<CacheType>) {
  await interaction.deferReply({ ephemeral: true });
}

async function tradeExtend(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  await interaction.deferReply({ ephemeral: true });
}
