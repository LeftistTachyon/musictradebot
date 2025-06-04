import {
  InteractionContextType,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";
import { kill } from "..";
import type { DiscordCommand } from "../types";
import { isBotOwner } from "../util";

const stop: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Kill the bot (Owner-only)")
    .setContexts(
      InteractionContextType.BotDM |
        InteractionContextType.Guild |
        InteractionContextType.PrivateChannel
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    if (!isBotOwner(interaction)) return;

    await kill();
  },
};

export default stop;
