import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { Long } from "mongodb";
import { fetchServerUser, fetchUser } from "../mongo";
import type { ButtonHandler } from "../types";
import { createProfileEmbed, isBotOwner } from "../util";

export const debug: ButtonHandler = {
  name: "debug",
  async execute(interaction) {
    if (!isBotOwner(interaction)) return;

    // ensure user exists before DM
    const user = interaction.user;
    if (!user) {
      console.warn(`User ${user} doesn't exist!`);
      console.trace();
      return;
    }

    const to = new Long("518196574052941857"),
      server = new Long("861805901434454016");

    // ensure opposing user exists
    const toProfile = await fetchUser(to);
    if (!toProfile) {
      console.warn(`User ${to} doesn't exist!`);
      console.trace();
      return;
    }
    const toServerProfile = await fetchServerUser(server, to);
    if (!toServerProfile) {
      console.warn(`User ${to} doesn't hasn't opted in (ever) to ${server}!`);
      return;
    }
    const nickname = toServerProfile.nickname ?? toProfile.name;

    const embed = await createProfileEmbed(
      toProfile,
      interaction.client,
      nickname
    );

    await user.send(
      embed
        ? {
            embeds: [embed.setFooter({ text: "Happy Trading!" })],
          }
        : {}
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
