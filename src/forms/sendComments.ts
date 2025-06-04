import { ActionRowBuilder } from "@discordjs/builders";
import { ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { Long } from "mongodb";
import { getStage, setTradeResponse } from "../mongo";
import type { FormHandler } from "../types";

export const sendComments: FormHandler = {
  name: "trade-sendComments",
  async execute(interaction) {
    await interaction.deferReply();

    const tradeName = interaction.customId.substring(
      interaction.customId.indexOf(" ") + 1
    );

    const stage = await getStage(tradeName);
    if (stage !== "phase2") {
      await interaction.editReply(
        "The window to submit responses to songs has passed. Sorry!"
      );
      return;
    }

    const rating = interaction.fields.getTextInputValue("rating"),
      comments = interaction.fields.getTextInputValue("comments");
    const responseObj = comments.length ? { rating, comments } : { rating };

    const success = await setTradeResponse(
      tradeName,
      new Long(interaction.user.id),
      responseObj
    );

    await interaction.editReply(
      success
        ? "Successfully submitted your response!\nWait until the end of the commenting period to see what everybody got and what they thought of the songs!"
        : "Something went horribly wrong! Please let the server owner know that you can't send in your song response!"
    );
  },
};

export function getCommentForm(tradeName: string) {
  return new ModalBuilder()
    .setTitle("Submit Song Response")
    .setCustomId("trade-sendComments " + tradeName)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("rating")
          .setLabel("Song rating")
          .setPlaceholder("Your rating of the song they gave you out of 10")
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(15)
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("comments")
          .setLabel("Comments")
          .setPlaceholder(
            "Have any comments you'd like to share with the song sender? This is the place!"
          )
          .setMaxLength(1022)
          .setRequired(false)
          .setStyle(TextInputStyle.Paragraph)
      )
    );
}
