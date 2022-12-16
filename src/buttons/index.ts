import { Collection } from "discord.js";
import { ButtonHandler } from "../types";
import { createUpdateProfile } from "./createUpdateProfile";
import { profileDeleteConfirm } from "./profileDelete";

const buttonList: ButtonHandler[] = [createUpdateProfile, profileDeleteConfirm];

// Creating collection of buttons
const output = new Collection<string, ButtonHandler>();
for (const button of buttonList) {
  output.set(button.name, button);
}
export default output;
