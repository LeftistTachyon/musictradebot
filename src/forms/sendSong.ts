import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Long } from "mongodb";
import { getStage, setTradeSong } from "../mongo";
import type { FormHandler } from "../types";

export const sendSong: FormHandler = {
  name: "trade-sendSong",
  async execute(interaction) {
    await interaction.deferReply();

    const tradeName = interaction.customId.substring(
      interaction.customId.indexOf(" ") + 1
    );

    const stage = await getStage(tradeName);
    if (stage !== "phase1") {
      await interaction.editReply(
        "The window to submit songs has passed. Sorry!"
      );
      return;
    }

    const song = interaction.fields.getTextInputValue("song"),
      comments = interaction.fields.getTextInputValue("comments");
    const songObj = comments.length ? { song, comments } : { song };

    const success = await setTradeSong(
      tradeName,
      new Long(interaction.user.id),
      songObj
    );

    await interaction.editReply(
      success
        ? "Successfully submitted your song!\nWait for the end of the trading period to recieve a song. See you then!"
        : "Something went horribly wrong! Please let the server owner know that you can't send in your song!"
    );
  },
};

export function getSongForm(tradeName: string) {
  return new ModalBuilder()
    .setTitle("Submit Song Trade")
    .setCustomId("trade-sendSong " + tradeName)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("song")
          .setLabel("Song")
          .setPlaceholder(
            "The name or link to the song you'd like to recommend"
          )
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("comments")
          .setLabel("Comments")
          .setPlaceholder(
            "Have any comments you'd like to share with the song recipient? This is the place!"
          )
          .setMaxLength(1022)
          .setRequired(false)
          .setStyle(TextInputStyle.Paragraph)
      )
    );
}
