import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getCommentForm } from "../forms/sendComments";
import { getStage } from "../mongo";
import { ButtonHandler } from "../types";

export const sendComments: ButtonHandler = {
  name: "trade-sendComments",
  async execute(interaction) {
    const tradeName = interaction.customId.substring(
      interaction.customId.indexOf(" ") + 1
    );

    const stage = await getStage(tradeName);
    if (stage !== "phase2") {
      await interaction.editReply(
        "The window to submit responses to songs has passed. Sorry!\n" + stage
      );
      return;
    }

    await interaction.showModal(getCommentForm(tradeName));
  },
};

export function getActionRow(tradeName: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("trade-sendComments " + tradeName)
      .setLabel("Submit comments")
      .setStyle(ButtonStyle.Success)
  );
}
