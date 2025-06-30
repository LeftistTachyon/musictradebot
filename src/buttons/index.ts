import { Collection } from "discord.js";
import type { ButtonHandler } from "../types";
import {
  createUpdateProfile1,
  createUpdateProfile2,
} from "./createUpdateProfile";
import { optIn, optOut } from "./optInOut";
import { profileDeleteConfirm } from "./profileDelete";
import { sendComments } from "./sendComments";
import { sendSong } from "./sendSong";
import { debug } from "./debug";

const buttonList: ButtonHandler[] = [
  createUpdateProfile1,
  createUpdateProfile2,
  optIn,
  optOut,
  profileDeleteConfirm,
  sendComments,
  sendSong,
  debug,
];

// Creating collection of buttons
const output = new Collection<string, ButtonHandler>();
for (const button of buttonList) {
  output.set(button.name, button);
}
export default output;
