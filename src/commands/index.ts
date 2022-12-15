import { Collection } from "discord.js";
import { DiscordCommand } from "../types";
import optin from "./optin";
import optout from "./optout";
import ping from "./ping";
import setname from "./setname";
import setnickname from "./setnickname";

// ! Add any new commands into this list
export const commandList: DiscordCommand[] = [
  ping,
  optin,
  optout,
  setname,
  setnickname,
];

// Creating collection of commands
const output = new Collection<string, DiscordCommand>();
for (const command of commandList) {
  output.set(command.data.name, command);
}

export default output;
