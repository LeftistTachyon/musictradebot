import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Long } from "mongodb";
import { updateServerSettings } from "../mongo";
import { DiscordCommand } from "../types";
import { isAdmin, isInServer } from "../util";

/**
 * Gets the default setting for the given setting
 *
 * @param setting the setting to fetch
 * @returns the default value for this setting, in hours
 */
function getDefaultTimeframes(setting: string) {
  switch (setting) {
    case "reminderPeriod":
      return 24;
    case "commentPeriod":
      return 48;
    default:
      return 0;
  }
}

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
    .setDescription("Set a server-wide time-based setting")
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
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!isInServer(interaction) || !isAdmin(interaction)) return;

    await interaction.deferReply({ ephemeral: true });

    const setting = interaction.options.getString("setting", true),
      timeframe =
        interaction.options.getNumber("timeframe", false) ||
        getDefaultTimeframes(setting),
      timeframeMin = Math.round(timeframe * 60);

    const newSetting = { [setting]: timeframeMin };

    const successful = await updateServerSettings(
      new Long(interaction.guildId),
      newSetting
    );

    interaction.editReply(
      successful
        ? `Successfully changed "${getUserString(
            setting
          )}" to ${timeframe} hours (${timeframeMin} minutes)`
        : "Something went horribly wrong! Please let the server owner know that you can't change server-wide time settings!"
    );
  },
};

export default setperiod;
