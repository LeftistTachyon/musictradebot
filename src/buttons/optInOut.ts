import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Long } from "bson";
import { setOpt } from "../mongo";
import { ButtonHandler } from "../types";
import { isInServer } from "../util";

export const optIn: ButtonHandler = {
  name: "opt-in",
  async execute(interaction) {
    if (!isInServer(interaction)) return;

    await interaction.deferReply({ ephemeral: true });

    const successful = await setOpt(
      new Long(interaction.guildId),
      new Long(interaction.user.id),
      true
    );

    await interaction.editReply(
      successful
        ? `You have successfully opted into ${interaction.guild?.name}'s music trades!`
        : "Something went horribly wrong! Please let the server owner know that you can't opt into trades!"
    );
  },
};

export const optOut: ButtonHandler = {
  name: "opt-out",
  async execute(interaction) {
    if (!isInServer(interaction)) return;

    await interaction.deferReply({ ephemeral: true });

    const successful = await setOpt(
      new Long(interaction.guildId),
      new Long(interaction.user.id),
      false
    );

    await interaction.editReply(
      successful
        ? `You have successfully opted out of ${interaction.guild?.name}'s music trades!`
        : "Something went horribly wrong! Please let the server owner know that you can't opt out of trades!"
    );
  },
};

export const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId("opt-in")
    .setLabel("Opt in")
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId("opt-out")
    .setLabel("Opt out")
    .setStyle(ButtonStyle.Secondary)
);
