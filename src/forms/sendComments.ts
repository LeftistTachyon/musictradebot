import { ActionRowBuilder } from "@discordjs/builders";
import { ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { Long } from "mongodb";
import { setTradeResponse } from "../mongo";
import { FormHandler } from "../types";

export const sendComments: FormHandler = {
  name: "trade-sendSong",
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const tradeName = interaction.customId.substring(
      interaction.customId.indexOf(" ") + 1
    );

    const rating = interaction.fields.getTextInputValue("rating"),
      comments = interaction.fields.getTextInputValue("comments");
    const responseObj = comments.length ? { rating, comments } : { rating };

    const success = await setTradeResponse(
      tradeName,
      new Long(interaction.user.id),
      responseObj
    );

    interaction.editReply(
      success
        ? "Successfully submitted your response!\nWait until the end of the commenting period to see what everybody got and what they thought of the songs!"
        : "Something went horribly wrong! Please let the server owner know that you can't send in your song response!"
    );
  },
};

export function getCommentForm(tradeName: string) {
  return new ModalBuilder()
    .setTitle("Submit Song Response")
    .setCustomId("trade-sendSong " + tradeName)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("rating")
          .setLabel("Song rating")
          .setPlaceholder("Your rating of the song they gave you out of 10")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("comments")
          .setLabel("Comments")
          .setPlaceholder(
            "Have any comments you'd like to share with the song sender? This is the place!"
          )
          .setRequired(false)
          .setStyle(TextInputStyle.Paragraph)
      )
    );
}
