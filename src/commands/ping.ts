import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Interaction,
  CacheType,
} from "discord.js";
import { DiscordCommand } from "../types";

const ping: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription('Replies with "Pong!"'),
  async execute(interaction: Interaction<CacheType>) {
    await (interaction as ChatInputCommandInteraction<CacheType>).reply(
      "Pong!"
    );
  },
};

export default ping;
