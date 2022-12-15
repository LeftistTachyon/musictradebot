import { Long } from "bson";
import { SlashCommandBuilder } from "discord.js";
import { setOpt } from "../mongo";
import { DiscordCommand } from "../types";
import { isInServer } from "../util";

const optout: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("optout")
    .setDescription("Opts out of this server's music trades")
    .setDMPermission(false),

  async execute(interaction) {
    if (!isInServer(interaction)) return;

    await interaction.deferReply({ ephemeral: true });

    const successful = await setOpt(
      new Long(interaction.guildId),
      new Long(interaction.user.id),
      false
    );

    interaction.editReply(
      successful
        ? `You have successfully opted out of ${interaction.guild?.name}'s music trades!`
        : "Something went horribly wrong! Please let the server owner know that you can't opt out of trades!"
    );
  },
};

export default optout;
