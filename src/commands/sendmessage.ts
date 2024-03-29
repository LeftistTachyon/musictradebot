import {
  ActionRowBuilder,
  APIInteractionDataResolvedChannel,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
  ChannelType,
  ForumChannel,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StageChannel,
  TextBasedChannel,
} from "discord.js";
import { registerActionRow } from "../buttons/createUpdateProfile";
import { actionRow as optActionRow } from "../buttons/optInOut";
import { DiscordCommand } from "../types";
import { isAdmin, isInServer } from "../util";

function validateChannel(
  channel:
    | CategoryChannel
    | StageChannel
    | ForumChannel
    | APIInteractionDataResolvedChannel
    | TextBasedChannel
): channel is TextBasedChannel {
  return (
    channel.type in
    [
      ChannelType.AnnouncementThread,
      ChannelType.GuildAnnouncement,
      ChannelType.GuildText,
      ChannelType.PublicThread,
    ]
  );
}

const sendmessage: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("Send a premade message into this channel (Admin-only)")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("The type of message to send into this channel")
        .addChoices(
          { name: "Registration button", value: "register" },
          { name: "Opt in/out", value: "opt" }
        )
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to send the message to")
        .addChannelTypes(
          ChannelType.AnnouncementThread,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildText,
          ChannelType.PublicThread
        )
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!isInServer(interaction) || !isAdmin(interaction)) return;

    const channel =
      interaction.options.getChannel("channel", false) || interaction.channel;
    if (!channel || !validateChannel(channel)) {
      await interaction.reply({
        content: "Invalid channel! Try a text channel that I can access.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    switch (interaction.options.getString("type", true)) {
      case "register":
        await channel.send({
          content:
            "Hello there! My name is Music Trader 2000, and I help people trade songs!\n" +
            "**Music trades allow you to share songs with others!** When you participate, you are randomly given another person to recommend a song for. Someone else will do the same, and at the end, you'll rate whether the song was good or not.\n" +
            "It's good fun, so we'd love to see you join!\n\n" +
            "If you would like to register for music trades in this server, click on the button below and fill out the forms.",
          components: [registerActionRow],
        });

        await interaction.editReply(
          `Successfully sent the register button into <#${channel.id}>!`
        );

        break;
      case "opt":
        await channel.send({
          content:
            "If you would like to opt in or out of the music trades in this server, click on the buttons below.",
          components: [optActionRow],
        });

        await interaction.editReply(
          `Successfully sent the opt in and out buttons into <#${channel.id}>!`
        );

        break;
      default:
        await interaction.editReply(
          "How did you choose an option that isn't in the list!?"
        );
        break;
    }
  },
};

export default sendmessage;
