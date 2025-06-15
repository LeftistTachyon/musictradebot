import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getCommentForm } from "../forms/sendComments";
import { fetchTrade, getStage } from "../mongo";
import type { ButtonHandler } from "../types";

export const sendComments: ButtonHandler = {
  name: "trade-sendComments",
  async execute(interaction) {
    const tradeName = interaction.customId.substring(
      interaction.customId.indexOf(" ") + 1
    );

    const stage = await getStage(tradeName);
    if (stage !== "phase2") {
      await interaction.reply(
        "The window to submit responses to songs has passed. Sorry!"
      );
      return;
    }

    const trade = await fetchTrade(tradeName);
    if (!trade) {
      console.warn("This trade does not exist!");
      console.trace();
      return;
    }

    const prevSubmit = trade.trades.find(
      (song) => interaction.user.id === song.to.toString()
    );

    await interaction.showModal(getCommentForm(tradeName, prevSubmit));
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
