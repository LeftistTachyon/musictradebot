import { SlashCommandBuilder } from "discord.js";
import { DiscordCommand } from "../types";
import { optIn } from "../util";

const optin: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("optin")
    .setDescription("Opts in to this server's song trades.")
    .setDMPermission(false),

  execute: optIn,
};

export default optin;
