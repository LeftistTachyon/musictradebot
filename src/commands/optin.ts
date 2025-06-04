import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import type { DiscordCommand } from "../types";
import { optIn } from "../util";

const optin: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("optin")
    .setDescription("Opts in to this server's song trades.")
    .setContexts(InteractionContextType.Guild),

  execute: optIn,
};

export default optin;
