import { Long } from "bson";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { generateProfileForm1, generateProfileForm2 } from "../forms/profile";
import { fetchUser } from "../mongo";
import type { ButtonHandler } from "../types";

export const createUpdateProfile1: ButtonHandler = {
  name: "profile-updateCreate1",
  async execute(interaction) {
    const user = await fetchUser(new Long(interaction.user.id));

    await interaction.showModal(generateProfileForm1(user));
  },
};

export const createUpdateProfile2: ButtonHandler = {
  name: "profile-updateCreate2",
  async execute(interaction) {
    const user = await fetchUser(new Long(interaction.user.id));

    await interaction.showModal(
      generateProfileForm2(
        user,
        interaction.customId.substring(interaction.customId.indexOf(" ") + 1)
      )
    );
  },
};

export const defaultActionRow =
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Create/update profile")
      .setCustomId("profile-updateCreate1")
      .setStyle(ButtonStyle.Primary)
  );

export const registerActionRow =
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Register")
      .setCustomId("profile-updateCreate1")
      .setStyle(ButtonStyle.Primary)
  );

export function createContinueActionRow(isNew: boolean) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Continue")
      .setCustomId("profile-updateCreate2 " + (isNew ? "Create" : "Edit"))
      .setStyle(ButtonStyle.Secondary)
  );
}
