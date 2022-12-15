import { SlashCommandBuilder } from "discord.js";
import { Long } from "bson";
import { setNickname } from "../mongo";
import { DiscordCommand } from "../types";

const setnickname: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("setnickname")
    .setDescription("Set your nickname in this server")
    .addStringOption((option) =>
      option
        .setName("nickname")
        .setDescription("Your new nickname for this server")
        .setRequired(true)
    )
    .setDMPermission(false),
  async execute(interaction) {
    if (interaction.guildId) {
      await interaction.deferReply({ ephemeral: true });

      const newNickname = interaction.options.getString("nickname", true);
      const successful = await setNickname(
        new Long(interaction.guildId),
        new Long(interaction.user.id),
        newNickname
      );

      interaction.editReply(
        successful
          ? `Successfully changed your nickname in this server to ${newNickname}!`
          : "Something went horribly wrong! Please let the server owner know that you can't change your nickname!"
      );
    } else
      interaction.reply({
        content: "Sorry, this command only works in servers I'm in!",
        ephemeral: true,
      });
  },
};

export default setnickname;
