import { SlashCommandBuilder } from "discord.js";
import { Long } from "bson";
import { setOpt } from "../mongo";
import { DiscordCommand } from "../types";

const optin: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("optin")
    .setDescription("Opts in to this server's song trades.")
    .setDMPermission(false),

  async execute(interaction) {
    if (interaction.guildId) {
      await interaction.deferReply({ ephemeral: true });

      const successful = await setOpt(
        new Long(interaction.guildId),
        new Long(interaction.user.id),
        true
      );

      interaction.editReply(
        successful
          ? `You have successfully opted into ${interaction.guild?.name}'s music trades!`
          : "Something went horribly wrong! Please let the server owner know that you can't opt into trades!"
      );
    } else
      interaction.reply({
        content: "Sorry, this command only works in servers I'm in!",
        ephemeral: true,
      });
  },
};

export default optin;
