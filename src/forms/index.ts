import { Collection } from "discord.js";
import { FormHandler } from "../types";
import { handleProfileForm1, handleProfileForm2 } from "./profile";

const formList: FormHandler[] = [handleProfileForm1, handleProfileForm2];

const output = new Collection<string, FormHandler>();
for (const form of formList) {
  output.set(form.name, form);
}
export default output;
