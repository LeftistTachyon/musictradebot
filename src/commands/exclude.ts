import { Long } from "bson";
import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { fetchServerUser, fetchUser, setOpt } from "../mongo";
import { DiscordCommand } from "../types";
import { isAdmin, isInServer } from "../util";

const exclude: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("exclude")
    .setDescription("Forcefully opts out a user (Admin-only)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to exclude from future trades")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    if (!isInServer(interaction) || !isAdmin(interaction)) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const u = interaction.options.getUser("user", true);

    const userID = new Long(u.id);
    if (!(await fetchUser(userID))) {
      await interaction.editReply(`User <@${u.id}> doesn't have a profile!`);
      return;
    }

    const serverID = new Long(interaction.guildId);
    if (await fetchServerUser(serverID, userID)) {
      await setOpt(serverID, userID, false);
    }

    await interaction.editReply(
      `Successfully temporarily excluded <@${u.id}> from future song trades. They may still opt in.`
    );
  },
};

export default exclude;
