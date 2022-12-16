import { SlashCommandBuilder } from "discord.js";
import { DiscordCommand } from "../types";
import { optOut } from "../util";

const optout: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("optout")
    .setDescription("Opts out of this server's music trades")
    .setDMPermission(false),

  execute: optOut,
};

export default optout;
