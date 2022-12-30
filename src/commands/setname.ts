import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Long } from "bson";
import { setUserName } from "../mongo";
import { DiscordCommand } from "../types";

const setname: DiscordCommand = {
  data: new SlashCommandBuilder()
    .setName("setname")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Your new preferred name")
        .setRequired(true)
    )
    .setDescription("Change your preferred name"),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const newName = interaction.options.getString("name", true);
    const successful = await setUserName(
      new Long(interaction.user.id),
      newName
    );

    await interaction.editReply(
      successful
        ? `Successfully changed your preferred name to ${newName}!`
        : "Something went horribly wrong! Please let the server owner know that you can't change your preferred name!"
    );
  },
};

export default setname;
