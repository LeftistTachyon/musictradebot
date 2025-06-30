import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { getSongForm } from "../forms/sendSong";
import { fetchTrade, getStage } from "../mongo";
import type { ButtonHandler } from "../types";

export const sendSong: ButtonHandler = {
  name: "trade-sendSong",
  async execute(interaction) {
    const tradeName = interaction.customId.substring(
      interaction.customId.indexOf(" ") + 1
    );

    const stage = await getStage(tradeName);
    if (stage !== "phase1") {
      await interaction.reply({
        content: "The window to submit songs has passed. Sorry!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const trade = await fetchTrade(tradeName);
    if (!trade) {
      console.warn("This trade does not exist!");
      console.trace();
      return;
    }

    const prevSubmit = trade.trades.find(
      (song) => interaction.user.id === song.from.toString()
    );

    // console.log(`including trade name ${tradeName} into form`);
    await interaction.showModal(getSongForm(tradeName, prevSubmit));
    // console.log("modal shown");
  },
};

export function getActionRow(tradeName: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("trade-sendSong " + tradeName)
      .setLabel("Submit song")
      .setStyle(ButtonStyle.Success)
  );
}
