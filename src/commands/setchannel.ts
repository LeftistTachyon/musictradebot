import {
  ChannelType,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";
import { Long } from "mongodb";
import { updateServerAnnounceCh } from "../mongo";
import { DiscordCommand } from "../types";
import { isAdmin, isInServer } from "../util";

const setchannel: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription(
      "Instruct the bot to use this channel for certain operations"
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription(
          "The type of usage this bot should use this channel for"
        )
        .addChoices({ name: "Announce new trades", value: "announce" })
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to use")
        .addChannelTypes(
          ChannelType.AnnouncementThread,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildText,
          ChannelType.PublicThread
        )
    )
    .setDMPermission(false),

  async execute(interaction) {
    if (!isInServer(interaction) || !isAdmin(interaction)) return;

    const channelID =
      interaction.options.getChannel("channel", false)?.id ||
      interaction.channelId;

    switch (interaction.options.getString("type", true)) {
      case "announce":
        await interaction.deferReply({ ephemeral: true });

        const successful = await updateServerAnnounceCh(
          new Long(interaction.guildId),
          new Long(channelID)
        );

        interaction.editReply(
          successful
            ? `Successfully changed the announcements channel to <#${channelID}>.`
            : `Unable to change the announcements channel to <#${channelID}> (Is it already set to <#${channelID}>?).`
        );

        break;

      default:
        interaction.reply({
          content:
            "How were you able to select an option that isn't in the list!?",
          ephemeral: true,
        });

        break;
    }
  },
};

export default setchannel;
