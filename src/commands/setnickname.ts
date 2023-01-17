import { SlashCommandBuilder } from "discord.js";
import { Long } from "bson";
import { setNickname } from "../mongo";
import { DiscordCommand } from "../types";
import { isInServer } from "../util";

const setnickname: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("setnickname")
    .setDescription("Set your nickname in this server")
    .addStringOption((option) =>
      option
        .setName("nickname")
        .setDescription("Your new nickname for this server")
        .setMaxLength(240)
        .setRequired(true)
    )
    .setDMPermission(false),

  async execute(interaction) {
    if (!isInServer(interaction)) return;

    await interaction.deferReply({ ephemeral: true });

    const newNickname = interaction.options.getString("nickname", true);
    const successful = await setNickname(
      new Long(interaction.guildId),
      new Long(interaction.user.id),
      newNickname
    );

    await interaction.editReply(
      successful
        ? `Successfully changed your nickname in this server to ${newNickname}!`
        : "Something went horribly wrong! Please let the server owner know that you can't change your nickname!"
    );
  },
};

export default setnickname;
