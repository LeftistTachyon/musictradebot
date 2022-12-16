import { Long } from "bson";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { deleteUser } from "../mongo";
import { ButtonHandler } from "../types";

export const profileDeleteConfirm: ButtonHandler = {
  name: "profileDelete-confirm",
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const successful = await deleteUser(new Long(interaction.user.id));

    await interaction.editReply(
      successful
        ? "Successfully deleted your profile. We're sorry to see you go!"
        : "Something went horribly wrong! Please let the server owner know that you can't opt delete your profile!"
    );
  },
};

export const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId("profileDelete-confirm")
    .setLabel("Yes, I'm sure!")
    .setStyle(ButtonStyle.Danger),
  new ButtonBuilder()
    .setCustomId("profileDelete-cancel")
    .setLabel("No, I'm not. (Dismiss the message below)")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true)
);
