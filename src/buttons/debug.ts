import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { ButtonHandler } from "../types";
import { getCommentForm } from "../forms/sendComments";
import { Long } from "mongodb";

export const debug: ButtonHandler = {
  name: "debug",
  async execute(interaction) {
    await interaction.showModal(
      getCommentForm("fake-trade", { from: new Long(1), to: new Long(2) })
    );
  },
};

export const debugActionRow =
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("debug")
      .setLabel("Debug")
      .setStyle(ButtonStyle.Primary)
  );
