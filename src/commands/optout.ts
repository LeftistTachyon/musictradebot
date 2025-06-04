import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import type { DiscordCommand } from "../types";
import { optOut } from "../util";

const optout: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("optout")
    .setDescription("Opts out of this server's music trades")
    .setContexts(InteractionContextType.Guild),

  execute: optOut,
};

export default optout;
