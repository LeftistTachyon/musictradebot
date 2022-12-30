import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getSongForm } from "../forms/sendSong";
import { getStage } from "../mongo";
import { ButtonHandler } from "../types";

export const sendSong: ButtonHandler = {
  name: "trade-sendSong",
  async execute(interaction) {
    const tradeName = interaction.customId.substring(
      interaction.customId.indexOf(" ") + 1
    );

    const stage = await getStage(tradeName);
    if (stage !== "phase1") {
      await interaction.reply(
        "The window to submit songs has passed. Sorry!\n" + stage
      );
      return;
    }
    // console.log(`including trade name ${tradeName} into form`);
    await interaction.showModal(getSongForm(tradeName));
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
