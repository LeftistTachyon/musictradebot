import { Collection } from "discord.js";
import { ButtonHandler } from "../types";
import {
  createUpdateProfile1,
  createUpdateProfile2,
} from "./createUpdateProfile";
import { optIn, optOut } from "./optInOut";
import { profileDeleteConfirm } from "./profileDelete";

const buttonList: ButtonHandler[] = [
  createUpdateProfile1,
  createUpdateProfile2,
  optIn,
  optOut,
  profileDeleteConfirm,
];

// Creating collection of buttons
const output = new Collection<string, ButtonHandler>();
for (const button of buttonList) {
  output.set(button.name, button);
}
export default output;
