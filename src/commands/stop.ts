import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { kill } from "..";
import { DiscordCommand } from "../types";
import { isBotOwner } from "../util";

const stop: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Kill the bot (Owner-only)")
    .setDMPermission(true)
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    if (!isBotOwner(interaction)) return;

    await kill();
  },
};

export default stop;
