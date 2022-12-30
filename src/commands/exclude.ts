import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandUserOption,
} from "discord.js";
import { Long } from "bson";
import { DiscordCommand } from "../types";
import { isAdmin, isInServer, optOut } from "../util";
import { fetchServerUser, fetchUser, setOpt } from "../mongo";

const exclude: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("exclude")
    .setDescription("Forcefully opts out a user (Admin-only)")
    .addUserOption(
      new SlashCommandUserOption()
        .setName("user")
        .setDescription("The user to exclude from future trades")
        .setRequired(true)
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!isInServer(interaction) || !isAdmin(interaction)) return;

    await interaction.deferReply({ ephemeral: true });

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
