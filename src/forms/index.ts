import { Collection } from "discord.js";
import { FormHandler } from "../types";
import { handleProfileForm1, handleProfileForm2 } from "./profile";
import { sendComments } from "./sendComments";
import { sendSong } from "./sendSong";

const formList: FormHandler[] = [
  handleProfileForm1,
  handleProfileForm2,
  sendComments,
  sendSong,
];

const output = new Collection<string, FormHandler>();
for (const form of formList) {
  output.set(form.name, form);
}
export default output;
