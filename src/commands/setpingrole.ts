import { Long } from "bson";
import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
} from "discord.js";
import { removeServerPingableRole, updateServerPingableRole } from "../mongo";
import { DiscordCommand } from "../types";
import { isAdmin, isInServer } from "../util";

const setpingrole: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("setpingrole")
    .setDescription(
      "Set the mentionable role that the bot can use to updates to song trades (Admin-only)"
    )
    .addMentionableOption((option) =>
      option
        .setName("role")
        .setDescription(
          "The pingable role to use for this purpose. Omit = no role"
        )
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!isInServer(interaction) || !isAdmin(interaction)) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const pingableRole = interaction.options.getMentionable("role", false);

    if (pingableRole) {
      if (
        (pingableRole && !(pingableRole instanceof Role)) ||
        !pingableRole.mentionable
      ) {
        await interaction.editReply(
          "That role either isn't a role or isn't a valid mentionable role!"
        );
        return;
      }

      const successful = await updateServerPingableRole(
        new Long(interaction.guildId),
        new Long(pingableRole.id)
      );

      await interaction.editReply(
        successful
          ? `Successfully changed the pingable role to <@&${pingableRole.id}>!`
          : "Something went horribly wrong! Please let the server owner know that you can't change the pingable role!"
      );
    } else {
      const successful = await removeServerPingableRole(
        new Long(interaction.guildId)
      );

      await interaction.editReply(
        successful
          ? `Successfully removed the pingable role!`
          : "Something went horribly wrong! Please let the server owner know that you can't remove the pingable role!"
      );
    }
  },
};

export default setpingrole;
