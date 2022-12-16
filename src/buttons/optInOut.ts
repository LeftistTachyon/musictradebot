import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { ButtonHandler } from "../types";
import { optIn as optInFunction, optOut as optOutFunction } from "../util";

export const optIn: ButtonHandler = {
  name: "opt-in",
  execute: optInFunction,
};

export const optOut: ButtonHandler = {
  name: "opt-out",
  execute: optOutFunction,
};

export const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder()
    .setCustomId("opt-in")
    .setLabel("Opt in")
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId("opt-out")
    .setLabel("Opt out")
    .setStyle(ButtonStyle.Secondary)
);
