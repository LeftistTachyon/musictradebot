import { Long } from "bson";
import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getServer, updateServerSettings } from "../mongo";
import type { DiscordCommand } from "../types";
import { getDefaultTimeframes, isAdmin, isInServer } from "../util";

function getUserString(setting: string) {
  switch (setting) {
    case "reminderPeriod":
      return "Last-call reminder period";
    case "commentPeriod":
      return "Song response period";
    default:
      return "";
  }
}

const setperiod: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("setperiod")
    .setDescription("Set a server-wide time-based setting (Admin-only)")
    .addStringOption((option) =>
      option
        .setName("setting")
        .setDescription("The server-wide setting to change")
        .addChoices(
          { name: "Last-call reminder period", value: "reminderPeriod" },
          { name: "Song response period", value: "commentPeriod" }
        )
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName("timeframe")
        .setDescription(
          "The number of hours to set this setting to. No value = default value"
        )
        .setMinValue(1)
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!isInServer(interaction) || !isAdmin(interaction)) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const setting = interaction.options.getString("setting", true),
      timeframe =
        interaction.options.getNumber("timeframe", false) ||
        getDefaultTimeframes(setting),
      timeframeMin = Math.round(timeframe * 60);

    const guildLong = new Long(interaction.guildId);
    const server = await getServer(guildLong);
    if (!server) {
      console.error(`Server ${guildLong} doesn't exist!`);
      return;
    }

    if (setting === "reminderPeriod") {
      if (timeframeMin > server.commentPeriod) {
        await interaction.editReply(`You can't set the reminder period (${timeframeMin} minutes) to be longer than the comment period (${server.commentPeriod} minutes).
Try again with different a value.`);
      }
    } else if (timeframeMin < server.reminderPeriod) {
      // setting === "commentPeriod"
      await interaction.editReply(`You can't set the comment period (${timeframeMin} minutes) to be shorter than the reminder period (${server.reminderPeriod} minutes).
Try again with different a value.`);
    }

    const newSetting = { [setting]: timeframeMin };

    const successful = await updateServerSettings(guildLong, newSetting);

    await interaction.editReply(
      successful
        ? `Successfully changed "${getUserString(
            setting
          )}" to ${timeframe} hours (${timeframeMin} minutes)`
        : "Something went horribly wrong! Please let the server owner know that you can't change server-wide time settings!"
    );
  },
};

export default setperiod;
