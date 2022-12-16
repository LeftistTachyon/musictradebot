import { Collection } from "discord.js";
import { ButtonHandler } from "../types";
import { profileDeleteCancel, profileDeleteConfirm } from "./profileDelete";

const buttonList: ButtonHandler[] = [profileDeleteCancel, profileDeleteConfirm];

// Creating collection of buttons
const output = new Collection<string, ButtonHandler>();
for (const button of buttonList) {
  output.set(button.name, button);
}
export default output;
